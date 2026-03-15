import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { compare } from 'bcryptjs';
import { AuthJwtPayload } from './strategies/types/auth-jwtPayload';
import refreshJwtConfig from './config/refresh-jwt.config';
import type { ConfigType } from '@nestjs/config';
//import { ConfigType } from '@nestjs/config';
import * as argon2 from 'argon2';
import { CurrentUser } from './strategies/types/current-user';
import { CreateUserDto } from 'src/users/user-dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { MoreThan, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginActivity, User, UserSession } from 'src/users/user.entity';
import * as crypto from 'crypto';
import { Role } from 'src/enums/role.enum';
import axios from 'axios';

@Injectable()
export class AuthService 
{
    constructor(@InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(UserSession) private readonly userSessionRepository: Repository<UserSession>,
        @InjectRepository(LoginActivity) private readonly loginActivityRepository: Repository<LoginActivity>,
        @Inject(refreshJwtConfig.KEY)
        private refreshTokenConfig: ConfigType<typeof refreshJwtConfig>,
        private usersService: UsersService,
        private jwtService: JwtService,
    ) {}

    async validateUserByEmail(email: string, password: string) 
    {
        const user = await this.usersService.findByEmail(email);
        if (!user) 
        {
            throw new UnauthorizedException('User Not Found!');
        }

        console.log('This is my email: ' + user.email);

        if (!user.password) 
        {
            throw new UnauthorizedException('User has no password set');
        }
        const isPasswordMatch = await compare(password, user.password);
        if (!isPasswordMatch) 
        {
            throw new UnauthorizedException('Invalid Credentials....1');
        }

        return { id: user.id };
    }

    async validateUserByPhone(phone: string, password: string) 
    {
        const user = await this.usersService.findByPhone(phone);
        if (!user) 
        {
            throw new UnauthorizedException('User Not Found!');
        }

        if (!user.password) 
        {
            throw new UnauthorizedException('User has no password set');
        }

        const isPasswordMatch = await compare(password, user.password);
        if (!isPasswordMatch) 
        {
            throw new UnauthorizedException('Invalid Credentials....2');
        }

        return { id: user.id };
    }

    async validateUserByUsername(username: string, password: string) 
    {
        const user = await this.usersService.findByPhone(username);
        if (!user) 
        {
            throw new UnauthorizedException('User Not Found!');
        }

        if (!user.password) 
        {
            throw new UnauthorizedException('User has no password set');
        }

        const isPasswordMatch = await compare(password, user.password);
        if (!isPasswordMatch) 
        {
            throw new UnauthorizedException('Invalid Credentials....3');
        }

        return { id: user.id };
    }

    async login(userId: number, req: Request) 
    {
        const user = await this.usersService.findUserDetails(userId);

        if (!user) throw new UnauthorizedException('User Not Found!');

        const { accessToken, refreshToken } = await this.generateTokens(user);

        const hashedRefreshToken = await argon2.hash(refreshToken);

        const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket?.remoteAddress || null;

        const userAgent = (req.headers['user-agent'] as string) || null;

        const session = await this.userSessionRepository.save(
            this.userSessionRepository.create({
                user_id: user.id,
                hashed_refresh_token: hashedRefreshToken,
                ip_address: ip,
                device: userAgent,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            })
        );

        await this.usersService.updateLastLogin(user.id, ip, userAgent);

        await this.loginActivityRepository.save(
            this.loginActivityRepository.create({
                user_id: user.id,
                session_id: session.id,
                ip_address: ip,
                device: userAgent,
                user_agent: userAgent,
                is_active: true,
            })
        );

        return {
            accessToken,
            refreshToken,
        };
    }

    async logins(userId: number) 
    {
        console.log('Logging in user:', userId);

        const user = await this.usersService.findUserDetails(userId);

        if (!user) 
        {
            throw new UnauthorizedException('User Not Found!');
        }

        const { accessToken, refreshToken } = await this.generateTokens(user);

        console.log('JWT Payload:', this.jwtService.decode(accessToken));

        const hashedRefreshToken = await argon2.hash(refreshToken);

        await this.usersService.updateHashedRefreshToken(userId, hashedRefreshToken);

        /// UPDATE LAST LOGIN
        await this.usersService.updateLastLogin(user.id);
        user.last_login_at = new Date();

        return {
            id: userId,
            accessToken,
            refreshToken,
        };
    }

    async generateTokens(currentUser: CurrentUser) 
    {
        //const payload: AuthJwtPayload = { sub: userId }
        const payload = { ...currentUser };
        //const payload = { sub: currentUser.id, ...currentUser }; // Ensure sub is included
        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload),
            this.jwtService.signAsync(payload, this.refreshTokenConfig),
        ]);

        return {
            accessToken,
            refreshToken,
        };
    }

    async validateJwtUser(details: {
        userId: number;
        firstName: string;
        lastName: string;
        middleName: string;
        email: string;
        phone: string;
        username: string;
        role: Role;
    }) {
        //const user = await this.usersService.findById(userId)
        //console.log('Validating JWT User:', details); // Debugging
        const user = await this.usersService.findUserDetails(details.userId);
        if (!user) {
            throw new UnauthorizedException('User Not Found!');
        }
        const currentUser: CurrentUser = {
            id: user.id,
            firstName: details.firstName,
            lastName: details.lastName,
            middleName: details.middleName,
            email: details.email,
            phone: details.phone,
            username: details.username,
            role: user.role,
        };
        return currentUser;
    }

    async refreshToken(userId: number, refreshToken: string) 
    {
        const sessions = await this.userSessionRepository.find({
            where: { user_id: userId }
        });

        if (!sessions.length) throw new UnauthorizedException('Session not found');

        let validSession: UserSession | null = null;

        for (const session of sessions) 
        {
            const isMatch = await argon2.verify(session.hashed_refresh_token, refreshToken);

            if (isMatch) 
            {
                validSession = session;
                break;
            }
        }

        if (!validSession) throw new UnauthorizedException('Invalid refresh token');

        const user = await this.usersService.findUserDetails(userId);

        if (!user) throw new UnauthorizedException('User not found');

        const tokens = await this.generateTokens(user);

        validSession.hashed_refresh_token = await argon2.hash(tokens.refreshToken);

        await this.userSessionRepository.save(validSession);

        return tokens;
    }

    async refreshTokens(userId: number) 
    {
        const user = await this.usersService.findUserDetails(userId);

        if (!user) throw new UnauthorizedException('User Not Found!');

        const { accessToken, refreshToken } = await this.generateTokens(user);

        const hashedRefreshToken = await argon2.hash(refreshToken);

        await this.usersService.updateHashedRefreshToken(userId, hashedRefreshToken);

        await this.usersService.updateLastLogin(user.id);

        return {
            id: userId,
            accessToken,
            refreshToken,
        };
    }

    async validateRefreshToken(userId: number, refreshToken: string) 
    {
        const user = await this.usersService.findById(userId);
        if (!user || !user.hashedRefreshToken) 
        {
            throw new UnauthorizedException('Invalid Refresh Token');
        }

        const refreshTokenMatches = await argon2.verify(user.hashedRefreshToken, refreshToken);

        if (!refreshTokenMatches) 
        {
            throw new UnauthorizedException('Invalid Refresh Token');
        }

        return {
            id: userId,
        };
    }

    async logout(sessionId: string) 
    {
        const session = await this.userSessionRepository.findOne({
            where: { id: sessionId },
        });

        if (!session) throw new NotFoundException('Session not found');

        await this.userSessionRepository.delete(session.id);

        await this.loginActivityRepository.update(
            { session_id: session.id },
            {
                is_active: false,
                logged_out_at: new Date(),
            },
        );

        await this.usersService.updateLogoutTime(session.user_id);
    }

    async logouts(userId: number) 
    {
        return await this.usersService.updateHashedRefreshToken(userId, '');
    }

    async validateGoogleUser(googleUser: CreateUserDto) 
    {
        const user = await this.usersService.findByEmail(googleUser.email);
        if (user) 
        {
            return user;
        } 
        else 
        {
            return await this.usersService.create(googleUser);
        }
    }

    async changePassword(userId: number, oldPassword: string, newPassword: string) 
    {
        const user = await this.usersService.findById(userId);

        if (!user) 
        {
            throw new NotFoundException('User Not Found..!');
        }

        if (!user.password) 
        {
            throw new Error('User password is not defined in the database');
        }

        const isPasswordMatch = await compare(oldPassword, user.password);

        if (!isPasswordMatch) 
        {
            throw new UnauthorizedException('Invalid Credentials...4');
        }

        // Proceed with updating the password
        const newHashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = newHashedPassword;

        await user.save();
        console.log('Password updated successfully');
    }

    async forgotPassword(email?: string, phone?: string) 
    {
        const user = await this.userRepo.findOne({ where: [{ email }, { phone }] });

        if (!user || !user.email || !user.phone) {
            throw new Error('User Email Or User Phone Not Found');
        }

        /// Generate a secure reset token and expiry date
        //const resetToken = `PASS-${nanoid(10)}`
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 1);

        user.resetToken = resetToken;
        user.expiryDate = expiryDate;
        await user.save();

        const resetUrl = `https://www.thetouchd.com/auth/reset-password?token=${resetToken}`;
        //await this.resetPasswordService.sendResetPasswordEmail(user.email, resetUrl)
    }

    async resetPassword(newPassword: string, resetToken: string) 
    {
        //: Promise<string>
        // Find the user by reset token and check if the expiry date is valid
        const user = await this.userRepo.findOne({
            where: {
                resetToken: resetToken,
                expiryDate: MoreThan(new Date()), // Ensure the expiryDate is greater than the current date
            },
        });

        if (!user) {
            throw new NotFoundException('Invalid or expired reset token');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;

        // Clear the reset token after successful password reset (optional)
        user.resetToken = null;
        user.expiryDate = null; // Optionally clear expiryDate

        await user.save();

        console.log('Password reset successfully');
    }
}
