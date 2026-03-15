import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payment } from './payment.entity';
import { Booking } from 'src/bookings/booking.entity';
import { PaystackService } from './paystack.service';

@Module({
    imports: [TypeOrmModule.forFeature([Payment, Booking])],
    controllers: [PaymentsController],
    providers: [PaymentsService, PaystackService],
})
export class PaymentsModule {}
