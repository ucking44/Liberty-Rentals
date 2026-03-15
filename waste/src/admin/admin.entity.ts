import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('admin_logs')
export class AdminLog extends BaseEntity 
{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    admin_id: string;

    @Column()
    action: string;

    @Column()
    entity: string;

    @Column()
    entity_id: string;

    @Column('json', { nullable: true })
    metadata?: any;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
