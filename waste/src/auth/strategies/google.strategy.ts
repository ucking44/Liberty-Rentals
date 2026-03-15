import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import googleOauthConfig from '../config/google-oauth.config';
import type { ConfigType } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
    constructor(
        @Inject(googleOauthConfig.KEY)
        private googleConfiguration: ConfigType<typeof googleOauthConfig>,
        private authService: AuthService,
    ) {
        if (
            !googleConfiguration.clientID ||
            !googleConfiguration.clientSecret ||
            !googleConfiguration.callbackURL
        ) {
            throw new Error(
                'Google OAuth configuration is incomplete. Please provide clientID, clientSecret, and callbackURL.',
            );
        }

        super({
            clientID: googleConfiguration.clientID,
            clientSecret: googleConfiguration.clientSecret,
            callbackURL: googleConfiguration.callbackURL,
            scope: ['email', 'profile'],
            //passReqToCallback: true
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) {
        console.log({ profile });
        const user = await this.authService.validateGoogleUser({
            firstName: profile.name.firstName,
            lastName: profile.name.lastName,
            //middleName: profile.name.middleName,
            username: profile.name.username,
            email: profile.email[0].value,
            phone: profile.phone[0].value,
            role: profile.role[0].value,
            //avartarUrl: profile.photo[0].value,
            password: '',
        });
        done(null, user);
        //return user
    }
}
