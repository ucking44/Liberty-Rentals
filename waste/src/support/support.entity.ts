import { Booking } from "src/bookings/booking.entity";
import { TicketStatus } from "src/enums/ticketStatus.enum";
import { User } from "src/users/user.entity";
import { BaseEntity, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('support_tickets')
export class SupportTicket extends BaseEntity
{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'bigint', name: 'user_id' })
    user_id: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'booking_id', type: 'uuid', nullable: true })
    booking_id: string;

    @ManyToOne(() => Booking, { nullable: true })
    @JoinColumn({ name: 'booking_id' })
    booking: Booking;

    @Column({ type: 'uuid', length: 30, nullable: true })
    subject: string;

    @Column({ type: 'text', nullable: true })
    message: string;

    @Index()
    @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.OPEN })
    status: TicketStatus;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
