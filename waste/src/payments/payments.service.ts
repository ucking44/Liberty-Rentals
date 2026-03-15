import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Payment } from './payment.entity';
import { Booking } from 'src/bookings/booking.entity';
import { PaymentMethod } from 'src/enums/payment.enum';
import { PaymentStatus, RefundStatus } from 'src/enums/paymentStatus.enum';
import { BookingStatus } from 'src/enums/bookingStatus.enum';
import { PaystackService } from './paystack.service';
import { v4 as uuidv4 } from 'uuid';
import { WalletService } from 'src/wallets/wallet.service';

@Injectable()
export class PaymentsService 
{
    constructor(private dataSource: DataSource,
        @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
        @InjectRepository(Booking) private bookingRepo: Repository<Booking>,
        private paystackService: PaystackService,
        private readonly walletService: WalletService
    ) {}

    /// INITIALIZE PAYMENT
    async initializePayment(bookingId: string, email: string, method: PaymentMethod) 
    {
        return this.dataSource.transaction(async (manager) => {

            const booking = await manager.findOne(Booking, { where: { id: bookingId } });

            if (!booking) throw new NotFoundException('Booking not found');

            if (booking.status !== BookingStatus.PENDING) throw new BadRequestException('Invalid booking state');

            /// CASH FLOW
            if (method === PaymentMethod.CASH || method === PaymentMethod.PAY_ON_PICKUP) 
            {
                const payment = manager.create(Payment, {
                    booking_id: bookingId,
                    amount: booking.price,
                    method: PaymentMethod.CASH,
                    status: PaymentStatus.PENDING,
                    pay_on_pickup: true,
                    transaction_reference: `CASH_${uuidv4()}`
                });

                await manager.save(payment);

                return { message: 'Cash payment selected' };
            }

            /// ONLINE FLOW
            const reference = `WASTE_${uuidv4()}`;

            const payment = manager.create(Payment, {
                booking_id: bookingId,
                amount: booking.price,
                method: PaymentMethod.ONLINE,
                status: PaymentStatus.PENDING,
                transaction_reference: reference,
            });

            await manager.save(payment);

            const paystackResponse = await this.paystackService.initializePayment(email, booking.price, reference);

            return {
                authorization_url: paystackResponse.authorization_url,
                access_code: paystackResponse.access_code,
                reference,
            };
        });
    }

    /// VERIFY PAYMENT (Manual Verify Endpoint)
    async verifyPayment(reference: string) 
    {
        return this.dataSource.transaction(async (manager) => {
            const payment = await manager.findOne(Payment, { where: { transaction_reference: reference } });

            if (!payment) throw new NotFoundException('Payment not found');

            if (payment.status === PaymentStatus.SUCCESS) return payment;

            const verification = await this.paystackService.verifyPayment(reference);

            if (verification.status !== 'success') throw new BadRequestException('Payment not successful');

            payment.status = PaymentStatus.SUCCESS;
            payment.paid_at = new Date();

            await manager.save(payment);

            await manager.update(
                Booking,
                { id: payment.booking_id },
                { status: BookingStatus.ASSIGNED },
            );

            return payment;
        });
    }

    /// WEBHOOK HANDLER
    async handleWebhook(payload: any, signature: string)
    {
        const isValid = this.paystackService.verifyWebhookSignature(payload, signature);

        if (!isValid) throw new BadRequestException('Invalid signature');

        /// PAYMENT SUCCESS WEBHOOK
        if (payload.event === 'charge.success')
        {
            const reference = payload.data.reference;
            return this.verifyPayment(reference);
        }

        /// REFUND PROCESSED WEBHOOK
        if (payload.event === 'refund.processed')
        {
            const reference = payload.data.transaction.reference;

            const payment = await this.paymentRepo.findOne({
                where: { transaction_reference: reference }
            });

            if (!payment) return;

            payment.refund_status = RefundStatus.SUCCESS;
            payment.refunded_at = new Date();

            await this.paymentRepo.save(payment);
        }

        return true;
    }

    async refundPayment(bookingId: string)
    {
        return this.dataSource.transaction(async (manager) => {

            const booking = await manager.findOne(Booking, {
                where: { id: bookingId },
                relations: ['payment']
            });

            if (!booking) throw new NotFoundException('Booking not found');

            /// REFUND SAFETY RULE
            if (booking.status === BookingStatus.PICKED_UP) throw new BadRequestException('Cannot refund after pickup');

            const payment = await manager.findOne(Payment, {
                where: { booking_id: bookingId }
            });

            if (!payment) throw new NotFoundException('Payment not found');

            if (payment.status !== PaymentStatus.SUCCESS) throw new BadRequestException('Payment not successful');

            if (payment.refund_status === RefundStatus.SUCCESS) throw new BadRequestException('Already refunded');

            /// MARK REFUND PENDING
            payment.refund_status = RefundStatus.PENDING;

            await manager.save(payment);

            /// PAYSTACK REFUND
            const refund = await this.paystackService.refundPayment(
                payment.transaction_reference,
                payment.amount
            );

            /// REFUND SUCCESS
            payment.refund_status = RefundStatus.SUCCESS;
            payment.refund_amount = payment.amount;
            payment.refund_reference = refund.reference;
            payment.refunded_at = new Date();

            await manager.save(payment);

            if (booking.status === BookingStatus.COMPLETED && !booking.partner_id)
            {
                throw new InternalServerErrorException('Completed booking has no partner');
            }

            /// REVERSE PARTNER WALLET IF EARNING WAS ALREADY CREDITED
            if (booking.status === BookingStatus.COMPLETED && booking.partner_id)
            {
                await this.walletService.reverseEarning(manager, booking.partner_id, booking.id);
            }

            /// CANCEL BOOKING
            booking.status = BookingStatus.CANCELLED;

            await manager.save(booking);

            return payment;
        });
    }
}
