import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from 'src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { LocalStrategy } from './strategies/local.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoginActivity, User, UserSession } from 'src/users/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import refreshJwtConfig from './config/refresh-jwt.config';
import jwtConfig from './config/jwt.config';
import { RefreshJwtStrategy } from './strategies/refresh.strategy';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './guards/roles/roles.guard';
import { JwtAuthGuard } from './guards/jwt-auth/jwt-auth.guard';
import googleOauthConfig from './config/google-oauth.config';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, LoginActivity, UserSession]),
        UsersModule,
        PassportModule,
        JwtModule.registerAsync(jwtConfig.asProvider()),
        ConfigModule.forFeature(jwtConfig),
        ConfigModule.forFeature(refreshJwtConfig),
        ConfigModule.forFeature(googleOauthConfig),
    ],
    controllers: [AuthController],
    providers: [AuthService, UsersService, LocalStrategy, JwtStrategy, RefreshJwtStrategy, GoogleStrategy,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: RolesGuard,
        },
    ],
    exports: [AuthService, UsersService],
})
export class AuthModule {}
