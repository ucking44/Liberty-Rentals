import { Controller, Get, Param, Post, Body } from "@nestjs/common";
import { WalletService } from "./wallet.service";

@Controller('wallet')
export class WalletController 
{
    constructor(private walletService: WalletService) {}

    @Get(':partnerId')
    async getWallet(@Param('partnerId') partnerId: string) 
    {
        return this.walletService.getWallet(partnerId);
    }

    @Get(':partnerId/transactions')
    async transactions(@Param('partnerId') partnerId: string) 
    {
        return this.walletService.getTransactions(partnerId);
    }

    @Post(':partnerId/withdraw')
    async withdraw(@Param('partnerId') partnerId: string, @Body('amount') amount: number) 
    {
        return this.walletService.requestWithdrawal(partnerId, amount);
    }
}
