import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerProfile } from './customer-profile.entity';
import { CustomerProfileService } from './customer-profile.service';
import { CustomerProfileController } from './customer-profile.controller';
import { User } from 'src/users/user.entity';


@Module({
    imports: [TypeOrmModule.forFeature([CustomerProfile, User])],
    controllers: [CustomerProfileController],
    providers: [CustomerProfileService],
    exports: [CustomerProfileService],
})
export class CustomerProfileModule {}
