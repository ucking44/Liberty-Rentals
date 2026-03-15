import { Controller, Post, Body, Headers, Req, Param } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentMethod } from 'src/enums/payment.enum';

@Controller('payments')
export class PaymentsController 
{
    constructor(private readonly paymentsService: PaymentsService) {}

    @Post('initialize')
    initialize(@Req() req, @Body() body: { bookingId: string; method: PaymentMethod }) 
    {
        return this.paymentsService.initializePayment(
            req.user.email,
            body.bookingId,
            body.method,
        );
    }

    @Post('verify')
    verify(@Body() body: { reference: string }) 
    {
        return this.paymentsService.verifyPayment(body.reference);
    }

    @Post('webhook')
    async webhook(@Body() body: any, @Headers('x-paystack-signature') signature: string) 
    {
        return this.paymentsService.handleWebhook(body, signature);
    }

    @Post('refund/:bookingId')
    async refundBooking(@Param('bookingId') bookingId: string)
    {
        return this.paymentsService.refundPayment(bookingId);
    }
}
