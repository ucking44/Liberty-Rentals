import { Booking } from "src/bookings/booking.entity";
import { PartnerEarningType } from "src/enums/partnerEarning.enum";
import { PartnerStatus } from "src/enums/partnerStatus.enum";
import { VehicleType } from "src/enums/vehicleType.enum";
import { User } from "src/users/user.entity";
import { BaseEntity, Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";


@Entity('partners')
@Index(['is_available'])
@Index(['status'])
export class Partner extends BaseEntity
{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'bigint', name: 'user_id' })
    user_id: number;

    @OneToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'enum', enum: VehicleType, default: VehicleType.TRUCK })
    vehicle_type: VehicleType;

    @Column({ nullable: true })
    license_number?: string;

    @Column({ default: false })
    is_approved: boolean;

    @Column({ default: true })
    is_available: boolean;

    @Column({ default: false })
    is_suspended: boolean;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    total_earnings: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    wallet_balance: number;

    @Column({ default: 0 })
    rating_count: number;

    @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
    rating_average: number;

    @Column({ type: 'enum', enum: PartnerStatus, default: PartnerStatus.PENDING })
    status: PartnerStatus;

    @Column({ default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at?: Date;
}

@Entity('partner_documents')
@Index(['partner_id'])
export class PartnerDocument extends BaseEntity
{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'partner_id', type: 'uuid', nullable: true })
    partner_id: string;

    @ManyToOne(() => Partner)
    @JoinColumn({ name: 'partner_id' })
    partner: Partner;

    @Column()
    document_type: string;

    @Column()
    file_url: string;

    @Column({ default: false })
    is_verified: boolean;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: false })
    created_at: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at?: Date;
}

@Entity('partner_earnings')
@Index(['partner_id'])
@Index(['booking_id'])
export class PartnerEarning extends BaseEntity
{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'partner_id', type: 'uuid', nullable: true })
    partner_id: string;

    @ManyToOne(() => Partner)
    @JoinColumn({ name: 'partner_id' })
    partner: Partner;

    @Column({ name: 'booking_id', type: 'uuid', nullable: true })
    booking_id: string;

    @ManyToOne(() => Booking)
    @JoinColumn({ name: 'booking_id' })
    booking: Booking;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    earning_amount: number;

    @Column({ type: 'enum', enum: PartnerEarningType, default: PartnerEarningType.EARNING })
    type: PartnerEarningType;

    @Column({ default: false })
    is_settled: boolean;

    @Column({ nullable: true })
    settled_at?: Date;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at?: Date;
}

