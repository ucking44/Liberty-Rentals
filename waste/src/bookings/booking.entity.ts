import { BookingStatus } from "src/enums/bookingStatus.enum";
import { Partner } from "src/partners/partner.entity";
import { Payment } from "src/payments/payment.entity";
import { User } from "src/users/user.entity";
import { Address, PickupSize, TimeSlot, WasteType, Zone } from "src/zones/zone.entity";
import { BaseEntity, Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('bookings')
@Index(['status'])
@Index(['user_id'])
@Index(['partner_id'])
@Index(['scheduled_at'])
@Index(['assigned_at'])
@Index(['created_at'])
export class Booking extends BaseEntity
{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'bigint', name: 'user_id' })
    user_id: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    customer: User;

    @Column({ name: 'partner_id', type: 'uuid', nullable: true })
    partner_id: string | null;

    @ManyToOne(() => Partner, { nullable: true })
    @JoinColumn({ name: 'partner_id' })
    partner?: Partner;

    @Column({ name: 'payment_id', type: 'uuid', nullable: true })
    payment_id: string;

    @OneToOne(() => Payment)
    @JoinColumn({ name: 'payment_id' })
    payment: Payment;

    @Column({ name: 'zone_id', type: 'uuid', nullable: true })
    zone_id: string;

    @ManyToOne(() => Zone)
    @JoinColumn({ name: 'zone_id' })
    zone: Zone;

    @Column({ name: 'slot_id', type: 'uuid', nullable: true })
    slot_id: string;

    @ManyToOne(() => TimeSlot)
    @JoinColumn({ name: 'slot_id' })
    slot: TimeSlot;

    @Column({ name: 'waste_type_id', type: 'uuid', nullable: true })
    waste_type_id: string;

    @ManyToOne(() => WasteType)
    @JoinColumn({ name: 'waste_type_id' })
    waste_type: WasteType;

    @Column({ name: 'pickup_size_id', type: 'uuid', nullable: true })
    pickup_size_id: string;

    @ManyToOne(() => PickupSize)
    @JoinColumn({ name: 'pickup_size_id' })
    pickup_size: PickupSize;

    //@Column({ type: 'datetime' })
    @Column({ type: 'date' })
    scheduled_at: string;

    @Column({ default: 0 })
    reassignment_count: number;

    @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
    status: BookingStatus;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    price: number;

    @Column({ nullable: true })
    pickup_address: string;

    @Column({ type: 'uuid' })
    address_id: string;

    @ManyToOne(() => Address)
    @JoinColumn({ name: 'address_id' })
    address: Address;

    @Column({ nullable: true })
    notes: string;

    @Column({ nullable: true })
    assigned_at: Date;

    @Column({ type: 'time' })
    start_time: string; // 08:00

    @Column({ type: 'time' })
    end_time: string; // 12:00

    @Column({ type: 'timestamp', nullable: true })
    completed_at: Date;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at?: Date;
}
