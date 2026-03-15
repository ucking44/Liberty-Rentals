import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class PaystackService 
{
    private readonly secretKey: string;
    private readonly baseUrl: string;
    private readonly webhookSecret: string;

    constructor() 
    {
        if (!process.env.PAYSTACK_SECRET_KEY) 
        {
            throw new InternalServerErrorException('PAYSTACK_SECRET_KEY is not defined');
        }

        if (!process.env.PAYSTACK_BASE_URL) 
        {
            throw new InternalServerErrorException('PAYSTACK_BASE_URL is not defined');
        }

        if (!process.env.PAYSTACK_WEBHOOK_SECRET) 
        {
            throw new InternalServerErrorException('PAYSTACK_WEBHOOK_SECRET is not defined');
        }

        this.secretKey = process.env.PAYSTACK_SECRET_KEY;
        this.baseUrl = process.env.PAYSTACK_BASE_URL;
        this.webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;
    }

    private get headers() 
    {
        return {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
        };
    }

    async initializePayment(email: string, amount: number, reference: string) 
    {
        try 
        {
            const response = await axios.post(
                `${this.baseUrl}/transaction/initialize`,
                {
                    email,
                    amount: Math.round(amount * 100),
                    reference,
                },
                { headers: this.headers },
            );

            return response.data.data;
        } 
        catch (error) 
        {
            throw new BadRequestException('Paystack initialization failed');
        }
    }

    async verifyPayment(reference: string) 
    {
        try 
        {
            const response = await axios.get(
                `${this.baseUrl}/transaction/verify/${reference}`,
                { headers: this.headers },
            );

            return response.data.data;
        } 
        catch (error) 
        {
            throw new BadRequestException('Paystack verification failed');
        }
    }

    verifyWebhookSignature(payload: any, signature: string): boolean 
    {
        const hash = crypto
            .createHmac('sha512', this.secretKey)
            .update(JSON.stringify(payload))
            .digest('hex');

        return hash === signature;
    }

    async refundPayment(reference: string, amount: number)
    {
        try
        {
            const response = await axios.post(
                `${this.baseUrl}/refund`,
                {
                    transaction: reference,
                    amount: Math.round(amount * 100),
                },
                { headers: this.headers },
            );

            return response.data.data;
        }
        catch (error)
        {
            throw new BadRequestException('Paystack refund failed');
        }
    }
}
