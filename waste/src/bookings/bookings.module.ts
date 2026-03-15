import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './booking.entity';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { WasteType, PickupSize, Address, Zone } from 'src/zones/zone.entity';
import { Partner } from 'src/partners/partner.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Booking, WasteType, PickupSize, Address, Zone, Partner]),],
    controllers: [BookingsController],
    providers: [BookingsService],
})
export class BookingsModule {}
