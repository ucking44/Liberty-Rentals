import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        super({
            usernameField: 'identifier', // Single field for email or username
            //passwordField: 'password',  // Field for password (default is 'password')
        });
    }

    async validate(identifier: string, password: string): Promise<any> {
        if (password === '') {
            throw new UnauthorizedException('Please Provide The Password');
        }
        // Logic to determine whether the identifier is email or username
        const isEmail = /\S+@\S+\.\S+/.test(identifier); // Basic email regex
        const user = isEmail
            ? await this.authService.validateUserByEmail(identifier, password)
            : await this.authService.validateUserByUsername(identifier, password);

        if (!user) {
            throw new Error('Invalid credentials...'); // Throwing errors appropriately
        }

        return user;
    }
}
