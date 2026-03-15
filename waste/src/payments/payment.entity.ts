import { Booking } from "src/bookings/booking.entity";
import { PaymentMethod } from "src/enums/payment.enum";
import { PaymentProvider } from "src/enums/paymentProviders.enum";
import { PaymentStatus, RefundStatus } from "src/enums/paymentStatus.enum";
import { BaseEntity, Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('payments')
@Index(['status'])
@Index(['booking_id'])
@Index(['transaction_reference'], { unique: true })
export class Payment extends BaseEntity
{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'booking_id', type: 'uuid', nullable: true })
    booking_id: string;

    @ManyToOne(() => Booking, { nullable: true })
    @JoinColumn({ name: 'booking_id' })
    booking: Booking;

    @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.ONLINE })
    method: PaymentMethod;

    @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
    status: PaymentStatus;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    amount: number;

    @Column({ type: 'enum', enum: PaymentProvider, default: PaymentProvider.CASH })
    provider: PaymentProvider;

    @Column({ type: 'varchar', length: 100, nullable: true })
    transaction_reference: string;

    @Column({ nullable: true })
    paid_at: Date;

    @Column({ default: false })
    pay_on_pickup: boolean;

    @Column({ type: 'enum', enum: RefundStatus, default: RefundStatus.NONE })
    refund_status: RefundStatus;

    @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
    refund_amount: number;

    @Column({ nullable: true })
    refund_reference?: string;

    @Column({ nullable: true })
    refunded_at: Date;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at?: Date;
}
