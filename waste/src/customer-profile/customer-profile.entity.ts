import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn, Index, DeleteDateColumn } from 'typeorm';
import { CustomerType } from 'src/enums/customerType.enum';
import { User } from 'src/users/user.entity';

@Entity('customer_profiles')
@Index('IDX_CUSTOMER_PROFILE_USER_ID', ['user_id'], { unique: true })
export class CustomerProfile extends BaseEntity 
{

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'bigint', unique: true })
    user_id: number;

    @OneToOne(() => User, (user) => user.customerProfile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'enum', enum: CustomerType, default: CustomerType.BUSINESS })
    customer_type: CustomerType;

    @Column({ nullable: true })
    business_name: string;

    @Column({ nullable: true })
    address_line_1: string;

    @Column({ nullable: true })
    address_line_2: string;

    @Column({ nullable: false })
    city: string;

    @Column({ nullable: false })
    state: string;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    latitude: number;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    longitude: number;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;
}
