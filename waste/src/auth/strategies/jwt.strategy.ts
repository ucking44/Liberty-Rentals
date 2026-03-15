import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthJwtPayload } from './types/auth-jwtPayload';
import { Inject, Injectable } from '@nestjs/common';
import jwtConfig from '../config/jwt.config';
import type { ConfigType } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { Role } from 'src/enums/role.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @Inject(jwtConfig.KEY)
        private jwtConfiguration: ConfigType<typeof jwtConfig>,
        private authService: AuthService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey:
                process.env.JWT_SECRET ||
                (() => {
                    throw new Error('JWT_SECRET is not defined in the environment variables');
                })(),
            //secretOrKey: jwtConfiguration.secret,
            ignoreExpiration: false,
        });
    }

    async validate(payload: {
        id: number;
        firstName: string;
        lastName: string;
        middleName: string;
        email: string;
        phone: string;
        username: string;
        role: Role;
    }) {
        //console.log('Decoded JWT Payload from validate:', payload.id); // Debugging
        const currentUser = {
            userId: payload.id,
            firstName: payload.firstName,
            lastName: payload.lastName,
            middleName: payload.middleName,
            email: payload.email,
            phone: payload.phone,
            username: payload.username,
            role: payload.role,
        };
        return this.authService.validateJwtUser(currentUser);
    }
}
