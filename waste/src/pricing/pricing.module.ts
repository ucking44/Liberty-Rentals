import { Module } from '@nestjs/common';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PricingRule } from './pricing.entity';

@Module({
    imports: [TypeOrmModule.forFeature([PricingRule])],
    controllers: [PricingController],
    providers: [PricingService]
})
export class PricingModule {}
