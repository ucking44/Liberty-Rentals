import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { AuthJwtPayload } from './types/auth-jwtPayload';
import { Inject, Injectable } from '@nestjs/common';
import refreshJwtConfig from '../config/refresh-jwt.config';
import type { ConfigType } from '@nestjs/config';
import { Request } from 'express';
import { AuthService } from '../auth.service';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'refresh-jwt') {
    constructor(
        @Inject(refreshJwtConfig.KEY)
        private refreshJwtConfiguration: ConfigType<typeof refreshJwtConfig>,
        private authService: AuthService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: refreshJwtConfiguration.secret,
            ignoreExpiration: false,
            passReqToCallback: true,
        } as StrategyOptionsWithRequest);
    }

    validate(req: Request, payload: AuthJwtPayload) {
        const authorizationHeader = req.get('authorization') ?? '';
        const refreshToken = authorizationHeader.replace('Bearer', '').trim();
        const userId = payload.sub;
        return this.authService.validateRefreshToken(userId, refreshToken);
    }
}
