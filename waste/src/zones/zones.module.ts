import { Module } from '@nestjs/common';
import { ZonesController } from './zones.controller';
import { ZonesService } from './zones.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address, PickupSize, WasteType, Zone } from './zone.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Zone, Address, WasteType, PickupSize])],
    controllers: [ZonesController],
    providers: [ZonesService]
})
export class ZonesModule {}
