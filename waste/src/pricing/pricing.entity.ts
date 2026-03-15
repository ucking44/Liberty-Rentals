import { PickupSize, WasteType, Zone } from "src/zones/zone.entity";
import { BaseEntity, Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";

@Entity('pricing_rules')
@Unique(['zone_id', 'waste_type_id', 'pickup_size_id'])
export class PricingRule extends BaseEntity
{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'uuid', name: 'zone_id' })
    zone_id: string;

    @ManyToOne(() => Zone)
    @JoinColumn({ name: 'zone_id' })
    zone: Zone;

    @Column({ name: 'waste_type_id', type: 'uuid' })
    waste_type_id: string;

    @ManyToOne(() => WasteType)
    @JoinColumn({ name: 'waste_type_id' })
    waste_type: WasteType;

    @Column({ name: 'pickup_size_id', type: 'uuid' })
    pickup_size_id: string;

    @ManyToOne(() => PickupSize)
    @JoinColumn({ name: 'pickup_size_id' })
    pickup_size: PickupSize;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    price: number;

    @Column({ default: true })
    is_active: boolean;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at?: Date;
}
