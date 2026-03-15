import { BaseEntity, BeforeInsert, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Role } from 'src/enums/role.enum';
import { CustomerProfile } from 'src/customer-profile/customer-profile.entity';


const name = 'users';

@Entity({ name: name })
export class User extends BaseEntity 
{
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ length: 50, type: 'varchar' })
    firstName: string;

    @Column({ length: 50, type: 'varchar' })
    lastName: string;

    @Column({ length: 50, type: 'varchar', nullable: true })
    middleName: string;

    @Column({ length: 100, unique: true, nullable: false })
    email: string;

    @Column({ unique: true, nullable: true })
    phone: string;

    @Column({ unique: true, type: 'varchar', length: 20, nullable: false })
    username: string;

    @Column({ length: 150, nullable: false })
    password?: string;

    @Column({ type: 'enum', enum: Role, default: Role.USER })
    role: Role;

    @Column({ nullable: true, length: 100 })
    displayName: string;

    @Column({ type: 'text', nullable: true })
    bio: string;

    @Column({ nullable: true, length: 10 })
    pin: string;

    @Column({ nullable: true })
    avatarUrl: string;

    @Column({ nullable: true })
    hashedRefreshToken: string;

    @Column({ nullable: true })
    refreshToken: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    resetToken: string | null;

    @Column({ type: 'timestamp', nullable: true })
    expiryDate: Date | null;

    @Column({ nullable: true })
    otp: string;

    //@Column({ type: "boolean", nullable: true })
    @Column({ type: 'boolean', default: false })
    isVerified: boolean;

    @Column({ default: true })
    is_active: boolean;

    @Column({ type: 'varchar', nullable: true, length: 50 })
    referralCode: string;

    @Column({ type: 'timestamp', nullable: true })
    otpExpiryDate: Date | null;

    @Column({ type: 'timestamp', nullable: true, default: null })
    last_login_at: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    last_logout_at: Date | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    last_login_ip: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    last_login_device: string | null;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: false })
    created_at: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;

    @OneToOne(() => CustomerProfile, profile => profile.user, { nullable: true })
    customerProfile: CustomerProfile;

    @BeforeInsert()
    async hashPassword() 
    {
        if (this.password) 
        {
            this.password = await bcrypt.hash(this.password, 10);
        } 
        else 
        {
            throw new Error('Password is undefined');
        }
    }

    async validatePassword(password: string): Promise<boolean> 
    {
        if (!this.password) 
        {
            throw new Error('Password is undefined');
        }
        return bcrypt.compare(password, this.password);
    }

    // @Column({ type: 'varchar', length: 30, nullable: true })
    // paystack_customer_code: string;

    // @Column({ type: 'varchar', length: 30, nullable: true })
    // paystack_authorization_code: string;
}

@Entity('login_activities')
@Index(['user_id'])
export class LoginActivity extends BaseEntity 
{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'bigint' })
    user_id: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'uuid', nullable: true })
    session_id: string | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    ip_address: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    device: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    user_agent: string | null;

    @Column({ type: 'boolean', default: true })
    is_active: boolean;

    @Column({ type: 'timestamp', nullable: true })
    logged_out_at: Date | null;

    @CreateDateColumn({ type: 'timestamp' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at: Date;
}

@Entity('user_sessions')
@Index(['user_id'])
export class UserSession extends BaseEntity 
{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'bigint' })
    user_id: number;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'text' })
    hashed_refresh_token: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    ip_address: string | null;

    @Column({ type: 'varchar', length: 255, nullable: true })
    device: string | null;

    @Column({ type: 'timestamp', nullable: true })
    expires_at: Date;

    @CreateDateColumn()
    created_at: Date;
}


