import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Partner, PartnerEarning } from './partner.entity';
import { Booking } from 'src/bookings/booking.entity';
import { PartnerStatus } from 'src/enums/partnerStatus.enum';
import { BookingStatus } from 'src/enums/bookingStatus.enum';
import { WalletService } from 'src/wallets/wallet.service';

@Injectable()
export class PartnersService 
{ 
    constructor(private dataSource: DataSource,
        @InjectRepository(Partner) private partnerRepo: Repository<Partner>,
        @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
        @InjectRepository(PartnerEarning) private earningRepo: Repository<PartnerEarning>,
        private readonly walletService: WalletService
    ) {}

    /// APPROVE PARTNER (ADMIN)
    async approvePartner(id: string) 
    {
        const partner = await this.partnerRepo.findOne({ where: { id } });

        if (!partner) throw new NotFoundException('Partner not found');

        partner.status = PartnerStatus.APPROVED;
        partner.is_approved = true;
        partner.is_active = true;

        return this.partnerRepo.save(partner);
    }

    /// TOGGLE AVAILABILITY
    async setAvailability(partnerId: string, isAvailable: boolean) 
    {
        const partner = await this.partnerRepo.findOne({ where: { id: partnerId } });
        if (!partner) throw new NotFoundException();

        if (!partner.is_approved || partner.is_suspended) 
        {
            throw new BadRequestException('Partner cannot go online');
        }

        if (!isAvailable) 
        {
            const activeAssignments = await this.bookingRepo.find({
                where: {
                    partner_id: partnerId,
                    status: BookingStatus.ASSIGNED,
                },
            });

            for (const booking of activeAssignments) 
            {
                booking.status = BookingStatus.DECLINED;
                booking.partner_id = null;
                await this.bookingRepo.save(booking);
            }
        }

        partner.is_available = isAvailable;
        return this.partnerRepo.save(partner);
    }

    /// ACCEPT BOOKING
    async acceptBooking(partnerId: string, bookingId: string) 
    {
        return this.dataSource.transaction(async (manager) => {
            const booking = await manager.findOne(Booking, {
                where: { id: bookingId },
            });

            if (!booking) throw new NotFoundException('Booking not found');

            if (booking.status !== BookingStatus.ASSIGNED) throw new BadRequestException('Booking not assignable');

            if (booking.partner_id !== partnerId) throw new ForbiddenException('Not your booking');

            booking.status = BookingStatus.ACCEPTED;
            return manager.save(booking);
        });
    }

    /// COMPLETE BOOKING
    async completeBooking(partnerId: string, bookingId: string) 
    {
        return this.dataSource.transaction(async (manager) => {

            const booking = await manager.findOne(Booking, {
                where: { id: bookingId },
                relations: ['payment'],
            });

            if (!booking) throw new NotFoundException('Booking not found');

            if (booking.partner_id !== partnerId) throw new ForbiddenException('Unauthorized partner');

            if (booking.status !== BookingStatus.PICKED_UP) throw new BadRequestException('Invalid status flow');

            // COMPLETE BOOKING
            booking.status = BookingStatus.COMPLETED;
            booking.completed_at = new Date();
            await manager.save(booking);

            /// CALCULATE EARNINGS
            const commissionRate = 0.15;
            const gross = Number(booking.price);
            const commission = gross * commissionRate;
            const net = gross - commission;

            /// STORE PARTNER EARNING RECORD
            await manager.save(PartnerEarning, {
                partner_id: partnerId,
                booking_id: booking.id,
                earning_amount: net,
                commission_amount: commission,
                gross_amount: gross,
            });

            /// CREDIT PARTNER WALLET (PENDING BALANCE) - This will move to available after settlement cron
            await this.walletService.creditEarning(manager, partnerId, booking.id, net,);

            /// UPDATE PARTNER LIFETIME EARNINGS
            await manager.increment(
                Partner,
                { id: partnerId },
                'total_earnings',
                net,
            );

            return booking;
        });
    }

    async declineBooking(partnerId: string, bookingId: string) 
    {
        return this.dataSource.transaction(async (manager) => {

            const booking = await manager.findOne(Booking, { where: { id: bookingId } });

            if (!booking) throw new NotFoundException();

            if (booking.partner_id !== partnerId) throw new ForbiddenException();

            if (booking.status !== BookingStatus.ASSIGNED) throw new BadRequestException('Cannot decline');

            booking.status = BookingStatus.DECLINED;
            booking.partner_id = null;

            await manager.save(booking);

            return { message: 'Booking declined and returned to pool' };
        });
    }
}
