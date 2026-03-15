import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Booking } from './booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { AssignBookingDto } from './dto/assign-booking.dto';
import { WasteType } from 'src/zones/zone.entity';
import { PickupSize } from 'src/zones/zone.entity';
import { Address } from 'src/zones/zone.entity';
import { Zone } from 'src/zones/zone.entity';
import { Partner } from 'src/partners/partner.entity';
import { BookingStatus } from 'src/enums/bookingStatus.enum';
import { UpdateBookingStatusDto } from './dto/update-status.dto';
import { BOOKING_STATUS_TRANSITIONS } from './dto/booking-status-transition';
import { PricingRule } from 'src/pricing/pricing.entity';
import { AddressVerificationStatus } from 'src/enums/addressVerificationStatus.enum';
import { ZonesService } from 'src/zones/zones.service';


@Injectable()
export class BookingsService 
{
    constructor(private dataSource: DataSource,
        @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
        @InjectRepository(WasteType) private wasteTypeRepo: Repository<WasteType>,
        @InjectRepository(PickupSize) private pickupSizeRepo: Repository<PickupSize>,
        @InjectRepository(Address) private addressRepo: Repository<Address>,
        @InjectRepository(Zone) private zoneRepo: Repository<Zone>,
        @InjectRepository(Partner) private partnerRepo: Repository<Partner>,
        @InjectRepository(PricingRule) private pricingRepo: Repository<PricingRule>,
        private readonly zonesService: ZonesService
    ) {}

    async create(userId: number, dto: CreateBookingDto) 
    {
        return this.dataSource.transaction(async (manager) => {
            const address = await manager.findOne(Address, {
                where: { id: dto.address_id, user_id: userId },
                relations: ['zone'],
            });

            if (!address) throw new NotFoundException('Address not found');

            if (!address.is_verified || address.verification_status !== AddressVerificationStatus.VERIFIED) 
            {
                throw new BadRequestException('Address not verified');
            }

            if (!address.zone.is_active || !address.zone.is_serviceable)
            {
                throw new BadRequestException('Zone not serviceable');
            }

            const wasteType = await manager.findOne(WasteType, {
                where: { id: dto.waste_type_id, is_active: true },
            });

            if (!wasteType) throw new NotFoundException('Invalid waste type');

            const pickupSize = await manager.findOne(PickupSize, {
                where: { id: dto.pickup_size_id },
            });

            if (!pickupSize) throw new NotFoundException('Invalid pickup size');

            const zone = await manager.findOne(Zone, {
                where: { id: address.zone_id, is_active: true },
            });

            if (!zone) throw new NotFoundException('Zone not active');

            const pricing = await manager.findOne(PricingRule, {
                where: {
                    zone_id: zone.id,
                    waste_type_id: dto.waste_type_id,
                    pickup_size_id: dto.pickup_size_id,
                    is_active: true,
                },
            });

            if (!pricing) throw new BadRequestException('Pricing not configured');

            const price = Number(pricing.price);
            //const price = Number(zone.base_price) + Number(pickupSize.base_price);

            await this.zonesService.reserveSlot(dto.slot_id, dto.scheduled_at);

            const booking = manager.create(Booking, {
                user_id: userId,
                waste_type_id: dto.waste_type_id,
                pickup_size_id: dto.pickup_size_id,
                address_id: dto.address_id,
                zone_id: zone.id,
                scheduled_at: dto.scheduled_at,
                start_time: dto.start_time,
                end_time: dto.end_time,
                notes: dto.notes,
                price,
                status: BookingStatus.PENDING,
            });

            return await manager.save(booking);
        });
    }

    /// ASSIGN BOOKING (ADMIN)
    async assign(bookingId: string, dto: AssignBookingDto) 
    {
        const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });

        if (!booking) throw new NotFoundException('Booking not found');

        if (booking.status !== BookingStatus.PENDING) 
        {
            throw new BadRequestException('Booking cannot be assigned');
        }

        const partner = await this.partnerRepo.findOne({ where: { id: dto.partner_id, is_active: true } });

        if (!partner) throw new NotFoundException('Partner not found');

        booking.partner_id = partner.id;
        booking.status = BookingStatus.ASSIGNED;
        booking.assigned_at = new Date();

        return await this.bookingRepo.save(booking);
    }

    /// UPDATE STATUS (PARTNER FLOW)
    async updateStatus(bookingId: string, partnerId: string, dto: UpdateBookingStatusDto) 
    {
        const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });

        if (!booking) throw new NotFoundException('Booking not found');

        if (booking.partner_id !== partnerId) throw new ForbiddenException('Not your booking');

        const allowedTransitions = BOOKING_STATUS_TRANSITIONS[booking.status];

        if (!allowedTransitions.includes(dto.status)) 
        {
            throw new BadRequestException(`Cannot change status from ${booking.status} to ${dto.status}`);
        }

        booking.status = dto.status;

        if (dto.status === BookingStatus.COMPLETED) 
        {
            booking.completed_at = new Date();
        }

        return await this.bookingRepo.save(booking);
    }

    /// CANCEL BOOKING (RELEASE SLOT HERE)
    async cancelBooking(bookingId: string, userId: number) 
    {
        return this.dataSource.transaction(async (manager) => {

            const booking = await manager.findOne(Booking, { where: { id: bookingId, user_id: userId } });

            if (!booking) throw new NotFoundException('Booking not found');

            if (booking.status === BookingStatus.CANCELLED) throw new BadRequestException('Already cancelled');

            if (booking.status === BookingStatus.COMPLETED) throw new BadRequestException('Cannot cancel completed booking');

            /// Update booking status FIRST
            booking.status = BookingStatus.CANCELLED;
            await manager.save(booking);

            /// Release slot capacity
            await this.zonesService.releaseSlot(booking.slot_id, booking.scheduled_at);

            return { message: 'Booking cancelled successfully' };
        });
    }

    /// CUSTOMER BOOKINGS
    async findCustomerBookings(userId: number) 
    {
        return await this.bookingRepo.find({
            where: { user_id: userId },
            relations: ['partner', 'zone', 'pickup_size', 'waste_type'],
            order: { created_at: 'DESC' },
        });
    }

    async findPartnerBookings(partnerId: string) 
    {
        return this.bookingRepo.find({
            where: { partner_id: partnerId },
            relations: ['customer', 'zone', 'address'],
            order: { created_at: 'DESC' },
        });
    }

    /// ADMIN LIST
    async findAll() 
    {
        return await this.bookingRepo.find({
            relations: ['customer', 'partner', 'zone'],
            order: { created_at: 'DESC' },
        });
    }

    async getAvailableBookings() 
    {
        return await this.bookingRepo.find({
            where: { status: BookingStatus.ASSIGNED },
            relations: ['zone', 'waste_type', 'pickup_size'],
        });
    }
}
