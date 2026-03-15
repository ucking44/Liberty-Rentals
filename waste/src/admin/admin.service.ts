import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Booking } from "src/bookings/booking.entity";
import { BookingStatus } from "src/enums/bookingStatus.enum";
import { PaymentStatus } from "src/enums/paymentStatus.enum";
import { TicketStatus } from "src/enums/ticketStatus.enum";
import { Partner } from "src/partners/partner.entity";
import { Payment } from "src/payments/payment.entity";
import { PricingRule } from "src/pricing/pricing.entity";
import { SupportTicket } from "src/support/support.entity";
import { SlotUsage, Zone } from "src/zones/zone.entity";
import { Between, Repository } from "typeorm";
import { DataSource } from "typeorm/browser";
import { AdminLog } from "./admin.entity";

@Injectable()
export class AdminService 
{
    private MAX_REASSIGNMENT = 3;
    constructor(@InjectRepository(Booking) private bookingRepo: Repository<Booking>,
        @InjectRepository(Partner) private partnerRepo: Repository<Partner>,
        @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
        @InjectRepository(PricingRule) private pricingRepo: Repository<PricingRule>,
        @InjectRepository(SupportTicket) private ticketRepo: Repository<SupportTicket>,
        @InjectRepository(Zone) private zoneRepo: Repository<Zone>,
        private dataSource: DataSource
    ) {}

    /// DASHBOARD METRICS
    async getDashboardMetrics() 
    {
        const today = new Date();
        const start = new Date(today.setHours(0, 0, 0, 0));
        const end = new Date(today.setHours(23, 59, 59, 999));

        const totalBookings = await this.bookingRepo.count();
        const bookingsToday = await this.bookingRepo.count({
            where: { created_at: Between(start, end) },
        });

        const totalRevenue = await this.paymentRepo
            .createQueryBuilder('payment')
            .select('SUM(payment.amount)', 'sum')
            .where('payment.status = :status', { status: PaymentStatus.SUCCESS })
            .getRawOne();

        const revenueToday = await this.paymentRepo
            .createQueryBuilder('payment')
            .select('SUM(payment.amount)', 'sum')
            .where('payment.status = :status', { status: PaymentStatus.SUCCESS })
            .andWhere('payment.created_at BETWEEN :start AND :end', { start, end })
            .getRawOne();

        const activePartners = await this.partnerRepo.count({
            where: { is_suspended: false },
        });

        const pendingBookings = await this.bookingRepo.count({
            where: { status: BookingStatus.PENDING },
        });

        const completedBookings = await this.bookingRepo.count({
            where: { status: BookingStatus.COMPLETED },
        });

        const openTickets = await this.ticketRepo.count({
            where: { status: TicketStatus.OPEN },
        });

        return {
            totalBookings,
            bookingsToday,
            totalRevenue: Number(totalRevenue.sum || 0),
            revenueToday: Number(revenueToday.sum || 0),
            activePartners,
            pendingBookings,
            completedBookings,
            openTickets,
        };
    }

    /// ADMIN BOOKING MANAGEMENT
    async getAllBookings() 
    {
        return this.bookingRepo.find({
            relations: ['user', 'partner', 'payment'],
            order: { created_at: 'DESC' },
        });
    }

    async assignBooking(bookingId: string, partnerId: string, adminId: string) 
    {
        return this.dataSource.transaction(async (manager) => {

            const booking = await manager.findOne(Booking, { where: { id: bookingId } });

            if (!booking) throw new NotFoundException();

            const oldValue = { partner_id: booking.partner_id, status: booking.status };

            booking.partner_id = partnerId;
            booking.status = BookingStatus.ASSIGNED;
            booking.assigned_at = new Date();

            await manager.save(booking);

            await this.logAction(manager, adminId, 'BOOKING_ASSIGNED', 'Booking', booking.id, oldValue, booking);

            return booking;
        });
    }

    /// PARTNER APPROVE / SUSPEND
    async suspendPartner(partnerId: string, adminId: string) 
    {
        return this.dataSource.transaction(async (manager) => {

            const partner = await manager.findOne(Partner, { where: { id: partnerId } });

            if (!partner) throw new NotFoundException();

            const oldValue = { ...partner };

            partner.is_suspended = true;
            partner.is_available = false;
            partner.is_active = false;

            await manager.save(partner);

            await this.logAction(manager, adminId, 'PARTNER_SUSPENDED', 'Partner', partner.id, oldValue, partner);

            return { message: 'Partner suspended' };
        });
    }

    async activatePartner(partnerId: string) 
    {
        await this.partnerRepo.update(partnerId, { is_suspended: false });
        return { message: 'Partner activated' };
    }

    /// PAYMENTS & TRANSACTIONS VIEW
    async getAllPayments() 
    {
        return this.paymentRepo.find({
            relations: ['booking'],
            order: { created_at: 'DESC' },
        });
    }

    async getRevenueSummary() 
    {
        const revenue = await this.paymentRepo
            .createQueryBuilder('payment')
            .select('SUM(payment.amount)', 'total')
            .where('payment.status = :status', { status: PaymentStatus.SUCCESS })
            .getRawOne();

        return { totalRevenue: Number(revenue.total || 0) };
    }

    async listPayments(filters: any) 
    {
        const qb = this.paymentRepo.createQueryBuilder('payment');

        if (filters.status) {
            qb.andWhere('payment.status = :status', { status: filters.status });
        }

        if (filters.method) {
            qb.andWhere('payment.method = :method', { method: filters.method });
        }

        if (filters.start && filters.end) {
            qb.andWhere('payment.created_at BETWEEN :start AND :end', {
            start: filters.start,
            end: filters.end,
            });
        }

        return qb.orderBy('payment.created_at', 'DESC').getMany();
    }

    /// PRICING RULE MANAGEMENT
    async createPricingRule(data: Partial<PricingRule>) 
    {
        const existing = await this.pricingRepo.findOne({
            where: {
                zone_id: data.zone_id,
                waste_type_id: data.waste_type_id,
                pickup_size_id: data.pickup_size_id,
            },
        });

        if (existing) throw new BadRequestException('Pricing rule already exists');

        const rule = this.pricingRepo.create(data);

        return this.pricingRepo.save(rule);
    }

    async updatePricingRule(id: string, data: Partial<PricingRule>)  /// NO CONTROLLER YET
    {
        const rule = await this.pricingRepo.findOne({ where: { id } });
        if (!rule) throw new NotFoundException('Pricing rule not found');
        await this.pricingRepo.update(id, data);
        //return this.pricingRepo.findOne({ where: { id } });
        return rule;
    }

    async togglePricingRule(id: string, active: boolean)  /// NO CONTROLLER YET
    {
        await this.pricingRepo.update(id, { is_active: active });
        return { message: 'Pricing rule updated' };
    }

    async getAllPricingRules() 
    {
        return this.pricingRepo.find({
            relations: ['zone', 'waste_type', 'pickup_size'],
        });
    }

    /// ZONE MANAGEMENT
    async getZones() 
    {
        return this.zoneRepo.find();
    }

    async createZone(data: Partial<Zone>) 
    {
        const zone = this.zoneRepo.create(data);
        return this.zoneRepo.save(zone);
    }

    async toggleZone(id: string, active: boolean) /// NO CONTROLLER YET
    {
        await this.zoneRepo.update(id, { is_active: active });
        return { message: 'Zone updated' };
    }

    async updateZone(id: string, dto: any)  /// UpdateZoneDto  /// NO CONTROLLER YET
    {
        const zone = await this.zoneRepo.findOne({ where: { id } });
        if (!zone) throw new NotFoundException();

        Object.assign(zone, dto);
        return this.zoneRepo.save(zone);
    }

    async monitorBookings() 
    {
        return this.bookingRepo.find({
            relations: ['customer', 'partner', 'zone', 'address'],
            order: { created_at: 'DESC' },
        });
    }

    /// SUPPORT TICKET ADMIN MANAGEMENT
    async getAllTickets() 
    {
        return this.ticketRepo.find({
            relations: ['user', 'booking'],
            order: { created_at: 'DESC' },
        });
    }

    async resolveTicket(id: string) 
    {
        const ticket = await this.ticketRepo.findOne({ where: { id } });
        if (!ticket) throw new NotFoundException('Ticket not found');
        await this.ticketRepo.update(id, { status: TicketStatus.RESOLVED });
        return { message: 'Ticket resolved' };
    }

    async getActivePickups() 
    {
        return this.bookingRepo.find({
            where: { status: BookingStatus.PICKED_UP },
            relations: ['partner', 'user'],
        });
    }

    async adminCancel(bookingId: string, adminId: string) /// NO CONTROLLER YET
    {
        return this.dataSource.transaction(async (manager) => {

            const booking = await manager.findOne(Booking, { where: { id: bookingId } });

            if (!booking) throw new NotFoundException('Booking not found');

            if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.COMPLETED) 
            {
                throw new BadRequestException('Cannot cancel this booking');
            }

            const slotUsage = await manager
                .createQueryBuilder(SlotUsage, 'usage')
                .setLock('pessimistic_write')
                .where('usage.slot_id = :slotId', { slotId: booking.slot_id })
                .andWhere('usage.date = :date', {
                    date: booking.scheduled_at,
                })
                .getOne();

            if (slotUsage && slotUsage.bookings_count > 0) 
            {
                slotUsage.bookings_count -= 1;
                await manager.save(slotUsage);
            }

            const oldStatus = booking.status;
            booking.status = BookingStatus.CANCELLED;

            await this.logAction(
                manager,
                adminId,
                'BOOKING_CANCELLED_BY_ADMIN',
                'Booking',
                booking.id,
                { status: oldStatus },
                { status: BookingStatus.CANCELLED }
            );

            return await manager.save(booking);
        });
    }

    async autoReassignBooking(bookingId: string, adminId: string) 
    {
        return this.dataSource.transaction(async (manager) => {

            const booking = await manager
                .createQueryBuilder(Booking, 'booking')
                .setLock('pessimistic_write')
                .where('booking.id = :id', { id: bookingId })
                .getOne();

            //const booking = await manager.findOne(Booking, { where: { id: bookingId } });

            if (!booking) throw new NotFoundException('Booking not found');

            if (booking.status !== BookingStatus.DECLINED && booking.status !== BookingStatus.REASSIGNING) 
            {
                throw new BadRequestException('Booking not eligible for reassignment');
            }

            if (booking.reassignment_count >= this.MAX_REASSIGNMENT)   /// MAX_REASSIGNMENT = 3;
            {
                booking.status = BookingStatus.PENDING;
                booking.partner_id = null;
                await manager.save(booking);

                return booking;
            }

            booking.status = BookingStatus.REASSIGNING;
            booking.reassignment_count += 1;
            await manager.save(booking);

            const availablePartner = await manager
                .createQueryBuilder(Partner, 'partner')
                .setLock('pessimistic_write')
                .where('partner.is_available = true')
                .andWhere('partner.is_suspended = false')
                .andWhere('partner.is_active = true')
                .andWhere('partner.is_approved = true')
                .orderBy('partner.rating_average', 'DESC')
                .getOne();

            //if (!availablePartner) throw new BadRequestException('No available partners');
            if (!availablePartner) 
            {
                booking.status = BookingStatus.PENDING;
                booking.partner_id = null;
                await manager.save(booking);
                return booking;
            }

            const oldPartner = booking.partner_id;

            booking.partner_id = availablePartner.id;
            booking.status = BookingStatus.ASSIGNED;
            booking.reassignment_count += 1;
            booking.assigned_at = new Date();

            await manager.save(booking);

            await manager.save(AdminLog, {
                admin_id: adminId || 'SYSTEM',
                action: 'BOOKING_REASSIGNED',
                entity: 'Booking',
                entity_id: booking.id,
                metadata: {
                    old_partner: oldPartner,
                    new_partner: availablePartner.id,
                },
            });

            return booking;
        });
    }

    /// You can call this from a cron job every 5 minutes.
    // It will find all bookings that have been in ASSIGNED status for more than 15 minutes and automatically reassign them.
    async reassignExpiredAssignments(adminId: string) 
    {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

        const expiredBookings = await this.bookingRepo.find({
            where: {
            status: BookingStatus.ASSIGNED,
            assigned_at: Between(new Date('2000-01-01'), fifteenMinutesAgo),
            },
        });

        for (const booking of expiredBookings) {
            await this.autoReassignBooking(booking.id, adminId);
        }

        return { processed: expiredBookings.length };
    }

    private async logAction(manager, adminId: string, action: string, entity: string, entityId: string, oldValue: any, newValue: any) 
    {
        await manager.save(AdminLog, {
            admin_id: adminId,
            action,
            entity,
            entity_id: entityId,
            metadata: {
                before: oldValue,
                after: newValue,
            },
        });
    }

    async getAdminLogs() 
    {
        return this.dataSource.getRepository(AdminLog).find({
            order: { created_at: 'DESC' },
        });
    }
}
