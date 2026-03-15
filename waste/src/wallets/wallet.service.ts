import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, EntityManager, Repository } from "typeorm";
import { PartnerWallet, PartnerWalletTransaction, WithdrawalRequest } from "./wallet.entity";
import { Partner } from "src/partners/partner.entity";
import { WalletTransactionStatus, WalletTransactionType, WithdrawalStatus } from "src/enums/walletTransaction.enum";

@Injectable()
export class WalletService 
{
    private MIN_WITHDRAWAL = 500;

    constructor(private dataSource: DataSource,
        @InjectRepository(PartnerWallet) private walletRepo: Repository<PartnerWallet>,
        @InjectRepository(PartnerWalletTransaction) private transactionRepo: Repository<PartnerWalletTransaction>,
        @InjectRepository(WithdrawalRequest) private withdrawalRepo: Repository<WithdrawalRequest>,
        @InjectRepository(Partner) private partnerRepo: Repository<Partner>,
    ) {}

    async getOrCreateWallet(manager: EntityManager, partnerId: string) 
    {
        let wallet = await manager.findOne(PartnerWallet, { where: { partner_id: partnerId } });

        if (!wallet) 
        {
            wallet = manager.create(PartnerWallet, { partner_id: partnerId });
            wallet = await manager.save(wallet);
        }

        return wallet;
    }

    async creditEarning(manager: EntityManager, partnerId: string, bookingId: string, amount: number) 
    {
        const wallet = await this.getOrCreateWallet(manager, partnerId);

        wallet.pending_balance = Number(wallet.pending_balance) + Number(amount);

        await manager.save(wallet);

        const settlementTime = new Date();
        settlementTime.setHours(settlementTime.getHours() + 24);

        await manager.save(PartnerWalletTransaction, {
            partner_id: partnerId,
            booking_id: bookingId,
            type: WalletTransactionType.EARNING,
            amount,
            status: WalletTransactionStatus.PENDING,
            reference: `BOOKING_${bookingId}`,
            settlement_available_at: settlementTime,
        });

        return wallet;
    }

    // movePendingToAvailable
    async settlePendingEarning(transactionId: string) 
    {
        return this.dataSource.transaction(async (manager) => {

            const tx = await manager.findOne(PartnerWalletTransaction, {
                where: { id: transactionId },
            });

            if (!tx) throw new NotFoundException();

            const wallet = await this.getOrCreateWallet(manager, tx.partner_id);

            wallet.pending_balance = Number(wallet.pending_balance) - Number(tx.amount);

            wallet.available_balance = Number(wallet.available_balance) + Number(tx.amount);

            await manager.save(wallet);
            return wallet;
        });
    }

    // debitAvailableBalance has no controller
    async debitAvailableBalance(manager, partnerId: string, amount: number, reference: string) 
    {
        const wallet = await this.getOrCreateWallet(manager, partnerId);

        if (wallet.available_balance < amount) throw new BadRequestException('Insufficient balance');

        wallet.available_balance -= amount;

        await manager.save(wallet);

        await manager.save(PartnerWalletTransaction, {
            partner_id: partnerId,
            type: WalletTransactionType.WITHDRAWAL,
            status: WalletTransactionStatus.COMPLETED,
            amount,
            reference
        });
    }

    async requestWithdrawal(partnerId: string, amount: number) 
    {
        return this.dataSource.transaction(async (manager) => {

            const wallet = await this.getOrCreateWallet(manager, partnerId);

            if (amount < this.MIN_WITHDRAWAL) throw new BadRequestException('Minimum withdrawal is 500');

            if (Number(wallet.available_balance) < amount) throw new BadRequestException('Insufficient balance');

            wallet.available_balance = Number(wallet.available_balance) - amount;

            await manager.save(wallet);

            const request = manager.create(WithdrawalRequest, {
                partner_id: partnerId,
                amount,
            });

            await manager.save(request);

            await manager.save(PartnerWalletTransaction, {
                partner_id: partnerId,
                type: WalletTransactionType.WITHDRAWAL,
                amount,
                status: WalletTransactionStatus.PENDING,
                reference: `WITHDRAWAL_${request.id}`
            });

            return request;
        });
    }

    async approveWithdrawal(adminId: string, withdrawalId: string) 
    {
        return this.dataSource.transaction(async (manager) => {

            const request = await manager.findOne(WithdrawalRequest, {
                where: { id: withdrawalId },
            });

            if (!request) throw new NotFoundException();

            if (request.status !== WithdrawalStatus.PENDING) throw new BadRequestException('Already processed');

            await this.debitAvailableBalance(manager, request.partner_id, Number(request.amount), `WITHDRAWAL_${withdrawalId}`);

            request.status = WithdrawalStatus.APPROVED;
            request.admin_id = adminId;
            request.processed_at = new Date();

            await manager.save(request);
            return request;
        });
    }

    async markWithdrawalPaid(adminId: string, withdrawalId: string) 
    {
        return this.dataSource.transaction(async (manager) => {

            const request = await manager.findOne(WithdrawalRequest, {
                where: { id: withdrawalId },
            });

            if (!request) throw new NotFoundException();

            request.status = WithdrawalStatus.PAID;
            request.admin_id = adminId;
            request.processed_at = new Date();

            await manager.save(request);

            await manager.update(
                PartnerWalletTransaction,
                { reference: `WITHDRAWAL_${withdrawalId}` },
                { status: WalletTransactionStatus.COMPLETED }
            );

            return request;
        });
    }

    async getWallet(partnerId: string) 
    {
        return this.walletRepo.findOne({
            where: { partner_id: partnerId },
        });
    }

    async getTransactions(partnerId: string) 
    {
        return this.transactionRepo.find({
            where: { partner_id: partnerId },
            order: { created_at: 'DESC' }
        });
    }

    async reverseEarning(manager: EntityManager, partnerId: string, bookingId: string)
    {
        const transaction = await manager.findOne(PartnerWalletTransaction, {
            where: {
                partner_id: partnerId,
                booking_id: bookingId
            }
        });

        if (!transaction) return;

        const wallet = await manager.findOne(PartnerWallet, {
            where: { partner_id: partnerId }
        });

        if (!wallet) return;

        if (transaction.status === WalletTransactionStatus.PENDING)
        {
            wallet.pending_balance = Number(wallet.pending_balance) - Number(transaction.amount);
        }
        else
        {
            wallet.available_balance = Number(wallet.available_balance) - Number(transaction.amount);
        }

        await manager.save(wallet);

        await manager.save(PartnerWalletTransaction, {
            partner_id: partnerId,
            booking_id: bookingId,
            type: WalletTransactionType.REVERSAL,
            amount: transaction.amount,
            status: WalletTransactionStatus.COMPLETED,
            reference: `REFUND_${bookingId}`
        });
    }
}
