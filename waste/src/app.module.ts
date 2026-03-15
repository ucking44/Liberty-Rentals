
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { LoginActivity, User, UserSession } from './users/user.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { IsUniqueConstraint } from './validation/is-unique-constraint';
import { PartnersModule } from './partners/partners.module';
import { BookingsModule } from './bookings/bookings.module';
import { PaymentsModule } from './payments/payments.module';
import { PricingModule } from './pricing/pricing.module';
import { ZonesModule } from './zones/zones.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { SupportModule } from './support/support.module';
import { CustomerProfileModule } from './customer-profile/customer-profile.module';
import { CustomerProfile } from './customer-profile/customer-profile.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { SystemModule } from './system/system.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),

        ScheduleModule.forRoot(),

        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: 'mysql',
                host: configService.get('DB_HOST'),
                port: parseInt(configService.get('DB_PORT') || '3306'),
                username: configService.get('DB_USERNAME'),
                password: configService.get('DB_PASSWORD'),
                database: configService.get('DB_NAME'),
                autoLoadEntities: true,
                entities: [User, CustomerProfile, LoginActivity, UserSession],
                synchronize: true,
                //migrations: [__dirname + '/migrations/*.migration.{ts,js}'],
            }),
        }),

        AuthModule, UsersModule, PartnersModule, BookingsModule, PaymentsModule, PricingModule, ZonesModule, NotificationsModule,
        AdminModule, SupportModule, CustomerProfileModule, SystemModule //IsUniqueConstraint
    ],
    controllers: [AppController],
    providers: [AppService, IsUniqueConstraint],
})
export class AppModule {}
