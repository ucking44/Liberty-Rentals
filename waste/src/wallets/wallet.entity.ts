import { Booking } from "src/bookings/booking.entity";
import { WalletTransactionStatus, WalletTransactionType, WithdrawalStatus } from "src/enums/walletTransaction.enum";
import { Partner } from "src/partners/partner.entity";
import { BaseEntity, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


@Entity('partner_wallets')
@Index(['partner_id'], { unique: true })
export class PartnerWallet extends BaseEntity 
{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', name: 'partner_id' })
    partner_id: string;

    @OneToOne(() => Partner)
    @JoinColumn({ name: 'partner_id' })
    partner: Partner;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    available_balance: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    pending_balance: number;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}


@Entity('partner_wallet_transactions')
@Index(['partner_id', 'created_at'])
@Index(['booking_id'])
export class PartnerWalletTransaction extends BaseEntity 
{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', name: 'partner_id' })
    partner_id: string;

    @ManyToOne(() => Partner)
    @JoinColumn({ name: 'partner_id' })
    partner: Partner;

    @Column({ type: 'uuid', name: 'booking_id', nullable: true })
    booking_id?: string;

    @ManyToOne(() => Booking)
    @JoinColumn({ name: 'booking_id' })
    booking?: Booking;

    @Column({ type: 'enum', enum: WalletTransactionType })
    type: WalletTransactionType;

    @Column({ type: 'enum', enum: WalletTransactionStatus, default: WalletTransactionStatus.PENDING })
    status: WalletTransactionStatus;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    amount: number;

    @Column({ nullable: true })
    reference?: string;

    @Column({ type: 'timestamp', nullable: true })
    settlement_available_at: Date;

    @Column({ nullable: true })
    metadata?: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}


@Entity('withdrawal_requests')
@Index(['partner_id'])
export class WithdrawalRequest extends BaseEntity 
{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', name: 'partner_id', unique: true })
    partner_id: string;

    @ManyToOne(() => Partner)
    @JoinColumn({ name: 'partner_id' })
    partner: Partner;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    amount: number;

    @Column({ type: 'enum', enum: WithdrawalStatus, default: WithdrawalStatus.PENDING })
    status: WithdrawalStatus;

    @Column({ nullable: true })
    admin_id: string;

    @Column({ nullable: true })
    bank_name?: string;

    @Column({ nullable: true })
    account_number?: string;

    @Column({ nullable: true })
    account_name?: string;

    @Column({ nullable: true })
    reference?: string;

    @Column({ nullable: true })
    processed_at?: Date;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
