import { Module } from "@nestjs/common";
import { WalletController } from "./wallet.controller";
import { WalletSettlementJob } from "./wallet-settlement.job";
import { WalletService } from "./wallet.service";
import { PartnerWallet, PartnerWalletTransaction, WithdrawalRequest } from "./wallet.entity";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [TypeOrmModule.forFeature([PartnerWallet, PartnerWalletTransaction, WithdrawalRequest])],
    providers: [WalletService, WalletSettlementJob],
    controllers: [WalletController],
})
export class WalletModule {}
