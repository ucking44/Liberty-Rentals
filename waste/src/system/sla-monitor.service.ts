import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Booking } from 'src/bookings/booking.entity';
import { BookingStatus } from 'src/enums/bookingStatus.enum';
import { AdminService } from 'src/admin/admin.service';

@Injectable()
export class SlaMonitorService 
{
    private readonly logger = new Logger(SlaMonitorService.name);

    constructor(@InjectRepository(Booking) private bookingRepo: Repository<Booking>,
        private adminService: AdminService,
    ) {}

    //Runs every 5 minutes
    @Cron('*/5 * * * *')
    async monitorBookingSLA() 
    {
        await this.handleAssignedTimeout();
        await this.handleAcceptedTimeout();
        await this.handleEnRouteTimeout();
        await this.handlePendingTimeout();
    }

    //ASSIGNED → if partner does not respond in 15 min - auto reassign
    private async handleAssignedTimeout() 
    {
        const threshold = new Date(Date.now() - 15 * 60 * 1000);

        const bookings = await this.bookingRepo.find({
            where: {
                status: BookingStatus.ASSIGNED,
                assigned_at: LessThan(threshold),
            },
        });

        for (const booking of bookings) 
        {
            await this.adminService.autoReassignBooking(booking.id, 'SYSTEM');
        }

        if (bookings.length > 0) 
        {
            this.logger.warn(`Reassigned ${bookings.length} expired bookings`);
        }
    }

    //ACCEPTED → partner accepted but didn't move - alert admin
    private async handleAcceptedTimeout() 
    {
        const threshold = new Date(Date.now() - 30 * 60 * 1000);

        const bookings = await this.bookingRepo
            .createQueryBuilder('booking')
            .where('booking.status = :status', { status: BookingStatus.ACCEPTED })
            .andWhere('booking.updated_at < :threshold', { threshold })
            .getMany();

        if (bookings.length > 0) 
        {
            this.logger.warn(`Accepted bookings stuck: ${bookings.length}`);
            // Later: send admin alerts
        }
    }

    //EN_ROUTE → partner never arrives - mark failed after 2 hours
    private async handleEnRouteTimeout() 
    {
        const threshold = new Date(Date.now() - 2 * 60 * 60 * 1000);

        const bookings = await this.bookingRepo
            .createQueryBuilder('booking')
            .where('booking.status = :status', { status: BookingStatus.EN_ROUTE })
            .andWhere('booking.updated_at < :threshold', { threshold })
            .getMany();

        for (const booking of bookings) 
        {
            booking.status = BookingStatus.FAILED;
            await this.bookingRepo.save(booking);
        }

        if (bookings.length > 0) 
        {
            this.logger.warn(`Marked ${bookings.length} bookings as FAILED`);
        }
    }

    //PENDING too long - notify admin
    private async handlePendingTimeout() 
    {
        const threshold = new Date(Date.now() - 60 * 60 * 1000);

        const bookings = await this.bookingRepo
            .createQueryBuilder('booking')
            .where('booking.status = :status', { status: BookingStatus.PENDING })
            .andWhere('booking.created_at < :threshold', { threshold })
            .getMany();

        if (bookings.length > 0) 
        {
            this.logger.warn(`Pending bookings stuck: ${bookings.length}`);
            // later send alert
        }
    }
}
