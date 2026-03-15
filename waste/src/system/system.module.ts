import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from 'src/bookings/booking.entity';
import { SlaMonitorService } from './sla-monitor.service';
import { AdminModule } from 'src/admin/admin.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Booking]),
        AdminModule,
    ],
    providers: [SlaMonitorService],
})
export class SystemModule {}
