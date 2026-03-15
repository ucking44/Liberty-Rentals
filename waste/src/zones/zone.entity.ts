import { AddressVerificationStatus } from "src/enums/addressVerificationStatus.enum";
import { PickupSizeType } from "src/enums/pickupSize.enum";
import { WasteTypeName } from "src/enums/waste.enum";
import { ZoneName } from "src/enums/zone.enum";
import { User } from "src/users/user.entity";
import { BaseEntity, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity('zones')
@Index('idx_zone_polygon', ['polygon'], { spatial: true })
export class Zone extends BaseEntity
{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'enum', enum: ZoneName, default: ZoneName.FREEZONE })
    name: ZoneName;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    base_price: number;

    @Column({ type: 'polygon', spatialFeatureType: 'Polygon', srid: 4326, nullable: false })
    polygon: string; //string; //object

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ default: true })
    is_active: boolean;

    @Column({ default: true })
    is_serviceable: boolean;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: false })
    created_at: Date;
    
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;
}

@Entity('addresses')
@Index('idx_address_location', ['location'], { spatial: true })
export class Address extends BaseEntity 
{
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column({ name: 'user_id', type: 'bigint' })
    user_id: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column()
    street: string;

    @Column()
    city: string;

    @Column()
    state: string;

    @Column({ nullable: true })
    landmark: string;

    @Column({ type: 'point', spatialFeatureType: 'Point', srid: 4326, nullable: true })
    location: string; //string; // object

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    latitude?: number;

    @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
    longitude?: number;

    @Column({ type: 'enum', enum: AddressVerificationStatus, default: AddressVerificationStatus.PENDING })
    verification_status: AddressVerificationStatus;

    @Column({ default: false })
    is_verified: boolean;

    @Column({ type: 'timestamp', nullable: true })
    verified_at?: Date;

    @Column({ nullable: true })
    verification_source?: string; // e.g., google_maps, manual_admin

    @Column({ name: 'zone_id', type: 'uuid', nullable: true })
    zone_id?: string;

    @ManyToOne(() => Zone)
    @JoinColumn({ name: 'zone_id' })
    zone: Zone;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: false })
    created_at: Date;
    
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;
}

@Entity('waste_types')
export class WasteType extends BaseEntity
{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'enum', enum: WasteTypeName, default: WasteTypeName.HOUSEHOLD })
    name: WasteTypeName;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ default: true })
    is_active: boolean;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: false })
    created_at: Date;
    
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;
}

@Entity('pickup_sizes')
export class PickupSize extends BaseEntity 
{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'enum', enum: PickupSizeType, default: PickupSizeType.SMALL })
    name: PickupSizeType;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    base_price: number;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: false })
    created_at: Date;
    
    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;
}

@Entity('time_slots')
export class TimeSlot extends BaseEntity 
{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    label: string; // e.g. "8AM - 12PM"

    @Column()
    start_time: string;

    @Column()
    end_time: string;

    @Column({ default: 10 })
    max_capacity: number;

    @Column({ default: true })
    is_active: boolean;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;
}

@Entity('slot_usage')
@Unique(['slot_id', 'date'])
export class SlotUsage extends BaseEntity 
{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid' })
    slot_id: string;

    @Column({ type: 'date' })
    date: string;

    @Column({ default: 0 })
    bookings_count: number;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    created_at: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    updated_at: Date;
}

