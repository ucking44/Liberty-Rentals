import { User } from "src/users/user.entity";
import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('notifications')
export class Notification extends BaseEntity
{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'bigint', name: 'user_id' })
    user_id: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'varchar', length: 30, nullable: true })
    title: string;

    @Column({ type: 'text', nullable: true })
    message: string;

    @Column({ default: false })
    is_read: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
