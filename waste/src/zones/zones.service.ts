import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Address, SlotUsage, TimeSlot, Zone } from './zone.entity';
import { AddressVerificationStatus } from 'src/enums/addressVerificationStatus.enum';
import { CreateAddressDto } from './dto/createAddressDto.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class ZonesService 
{
    constructor(private dataSource: DataSource,
        @InjectRepository(Address) private addressRepo: Repository<Address>,
    ) {}

    async create(userId: number, dto: CreateAddressDto) 
    {
        return this.dataSource.transaction(async (manager) => {

            const address = await manager.query(
                `
                INSERT INTO addresses (id, user_id, street, city, state, landmark, location, verification_status, is_verified, created_at, updated_at)
                VALUES (UUID(), ?, ?, ?, ?, ?, ST_GeomFromText(?, 4326), 'pending', false, NOW(), NOW())
                `,
                [
                    userId,
                    dto.street,
                    dto.city,
                    dto.state,
                    dto.landmark || null,
                    `POINT(${dto.longitude} ${dto.latitude})`,
                ],
            );

            const [created] = await manager.query(`SELECT * FROM addresses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`, [userId]);

            await this.verifyAddress(created.id);
            //await this.autoVerify(created.id, manager);

            return created;
        });
    }

    async autoVerify(addressId: string, manager?: EntityManager) 
    {
        const em = manager ?? this.dataSource.manager;

        const address = await em.findOne(Address, {
            where: { id: addressId },
        });

        if (!address || !address.location) throw new BadRequestException('Invalid address');

        const zone = await em
            .createQueryBuilder(Zone, 'zone')
            .where('zone.is_active = true')
            .andWhere('zone.is_serviceable = true')
            .andWhere(
                'ST_Contains(zone.polygon, ST_SetSRID(ST_GeomFromGeoJSON(:point), 4326))',
                { point: JSON.stringify(address.location) },
            )
            .getOne();

        if (!zone) 
        {
            address.verification_status = AddressVerificationStatus.REJECTED;
            address.is_verified = false;
            //address.verification_source = 'geo_auto_fail';
            await em.save(address);
            //throw new BadRequestException('Address outside service area');
            return;
        }

        address.zone_id = zone.id;
        address.verification_status = AddressVerificationStatus.VERIFIED;
        address.is_verified = true;
        address.verified_at = new Date();
        address.verification_source = 'system_geo_check';

        await em.save(address);
        //return await em.save(address);
    }

    async adminManualVerify(addressId: string, zoneId: string) 
    {
        const address = await this.dataSource.manager.findOne(Address, { where: { id: addressId } });

        if (!address) throw new NotFoundException();

        const zone = await this.dataSource.manager.findOne(Zone, { where: { id: zoneId } });

        if (!zone) throw new NotFoundException('Zone not found');

        address.zone_id = zone.id;
        address.is_verified = true;
        address.verification_status = AddressVerificationStatus.VERIFIED;
        address.verification_source = 'manual_admin';  /// admin_manual
        address.verified_at = new Date();

        return this.dataSource.manager.save(address);
    }

    async verifyAddress(addressId: string) 
    {
        return this.dataSource.transaction(async (manager) => {

            const [address] = await manager.query(`SELECT id, location FROM addresses WHERE id = ?`, [addressId]);

            if (!address) throw new NotFoundException();

            const [zone] = await manager.query(
                `
                SELECT *
                FROM zones
                WHERE is_active = true
                AND is_serviceable = true
                AND ST_Contains(polygon, location)
                LIMIT 1
                `,
            );

            if (!zone) 
            {
                await manager.query(
                    `
                    UPDATE addresses
                    SET verification_status = 'rejected',
                        is_verified = false
                    WHERE id = ?
                    `,
                    [addressId],
                );

                throw new BadRequestException('Address outside service zone');
            }

            await manager.query(
                `
                UPDATE addresses
                SET zone_id = ?,
                    verification_status = 'verified',
                    is_verified = true,
                    verified_at = NOW(),
                    verification_source = 'system_geo_check'
                WHERE id = ?
                `,
                [zone.id, addressId],
            );

            return { message: 'Address verified' };
        });
    }

    async reserveSlot(slotId: string, date: string) 
    {
        return this.dataSource.transaction(async (manager) => {

            const slot = await manager.findOne(TimeSlot, {
                where: { id: slotId, is_active: true },
            });

            if (!slot) throw new BadRequestException('Invalid slot');

            let usage = await manager.findOne(SlotUsage, {
                where: { slot_id: slotId, date },
                lock: { mode: 'pessimistic_write' },
            });

            if (!usage) 
            {
                usage = manager.create(SlotUsage, {
                    slot_id: slotId,
                    date,
                    bookings_count: 0,
                });
                usage = await manager.save(usage);
            }

            if (usage.bookings_count >= slot.max_capacity) 
            {
                throw new BadRequestException('Time slot full');
            }

            usage.bookings_count += 1;

            await manager.save(usage);
        });
    }

    async releaseSlot(slotId: string, date: string) 
    {
        await this.dataSource.transaction(async (manager) => {

            const usage = await manager.findOne(SlotUsage, {
                where: { slot_id: slotId, date },
                lock: { mode: 'pessimistic_write' },
            });

            if (!usage) return;

            if (usage.bookings_count > 0) 
            {
                usage.bookings_count -= 1;
                await manager.save(usage);
            }
        });
    }
    
    async releaseSlots(slotId: string, date: string) 
    {
        await this.dataSource
            .createQueryBuilder()
            .update(SlotUsage)
            .set({
                bookings_count: () => 'bookings_count - 1',
            })
            .where('slot_id = :slotId', { slotId })
            .andWhere('date = :date', { date })
            .execute();
    }
}
