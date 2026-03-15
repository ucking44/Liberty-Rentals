import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { PartnerWallet, PartnerWalletTransaction } from "./wallet.entity";
import { WalletTransactionStatus } from "src/enums/walletTransaction.enum";

@Injectable()
export class WalletSettlementJob 
{
    private readonly logger = new Logger(WalletSettlementJob.name);

    constructor(private dataSource: DataSource,
        @InjectRepository(PartnerWalletTransaction) private txRepo: Repository<PartnerWalletTransaction>,
        @InjectRepository(PartnerWallet) private walletRepo: Repository<PartnerWallet>,
    ) {}

    /// Runs every 5 minutes
    @Cron('*/5 * * * *')
    async settlePendingTransactions() 
    {
        const now = new Date();

        const transactions = await this.txRepo.find({
            where: {
                status: WalletTransactionStatus.PENDING
            }
        });

        for (const tx of transactions) 
        {
            if (!tx.settlement_available_at) continue;

            if (tx.settlement_available_at > now) continue;

            await this.dataSource.transaction(async (manager) => {

                const wallet = await manager.findOne(PartnerWallet, {
                    where: { partner_id: tx.partner_id },
                });

                if (!wallet) return;

                wallet.pending_balance = Number(wallet.pending_balance) - Number(tx.amount);

                wallet.available_balance = Number(wallet.available_balance) + Number(tx.amount);

                await manager.save(wallet);

                tx.status = WalletTransactionStatus.COMPLETED;

                await manager.save(tx);

                this.logger.log(`Settled wallet transaction ${tx.id}`);
            });
        }
    }
}
