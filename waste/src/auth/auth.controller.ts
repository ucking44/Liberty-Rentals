import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { EmailLoginDto } from './auth-dto/email-login.dto';
//import { JwtAuthGuard } from './jwt/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { LocalAuthGuard } from './guards/local-auth/local-auth.guard';
import { RefreshAuthGuard } from './guards/refresh-auth/refresh-auth.guard';
import { Public } from './decorator/public.decorator';
import { GoogleAuthGuard } from './guards/google-auth/google-auth.guard';
import { ChangePasswordDto } from './auth-dto/change-password.dto';
import { ForgotPasswordDto } from './auth-dto/forgot-password.dto';
import { ResetPasswordDto } from './auth-dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth/jwt-auth.guard';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
    user: {
        id: number;
    };
}

//@Public()
@Controller('auth')
export class AuthController 
{
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @Public()
    @UseGuards(LocalAuthGuard)
    async login(@Req() req: Request) 
    {
        return this.authService.login(req.user!.id, req);
    }

    @Public()
    @HttpCode(HttpStatus.OK)
    @UseGuards(LocalAuthGuard)
    @Post('login')
    async logins(@Req() req: AuthenticatedRequest) 
    {
        return this.authService.login(req.user.id, req);
    }

    @UseGuards(RefreshAuthGuard)
    @Post('refresh')
    refreshToken(@Req() req: any, @Body('refreshToken') refreshToken: string) 
    {
        return this.authService.refreshToken(req.user.id, refreshToken);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout/:sessionId')
    logout(@Param('sessionId') sessionId: string) 
    {
        return this.authService.logout(sessionId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('logout')
    logouts(@Req() req, @Res() res) 
    {
        const logout = this.authService.logout(req.user.id);
        if (!logout) 
        {
            return res.status(404).json({
                success: false,
                message: 'Something Went Wrong...',
            });
        } 
        else 
        {
            res.status(200).json({
                success: true,
                message: 'User Successfully Logout!',
            });
        }
    }

    @Public()
    @UseGuards(GoogleAuthGuard)
    @Get('google/login')
    googleLogin() {}

    @Public()
    @UseGuards(GoogleAuthGuard)
    @Get('google/callback')
    async googleCallback(@Req() req, @Res() res) 
    {
        const response = await this.authService.login(req.user.id, req);
        res.redirect(`http://localhost:5000?token=${response.accessToken}`);
    }

    @UseGuards(JwtAuthGuard)
    @Put('change-password')
    async changePassword(@Body() changePasswordDto: ChangePasswordDto, @Req() req, @Res() res) 
    {
        await this.authService.changePassword(
            req.user.id,
            changePasswordDto.oldPassword,
            changePasswordDto.newPassword,
        );

        return res.status(200).json({
            success: true,
            message: 'Password Was Changed Successfully!',
        });
    }

    //@HttpCode(HttpStatus.OK)
    @Public()
    @Post('forgot-password')
    async forgotPassword(@Res() res, @Body() forgotPassword: ForgotPasswordDto) 
    {
        await this.authService.forgotPassword(forgotPassword.email, forgotPassword.phone);
        return res.status(200).json({
            success: true,
            message:
                'If this user exists, they will receive an email or otp to reset their password...',
        });
    }

    @Public()
    @Post('reset-password')
    async resetPassword(@Res() res, @Body() resetPasswordDto: ResetPasswordDto) 
    {
        await this.authService.resetPassword(
            resetPasswordDto.newPassword,
            resetPasswordDto.resetToken,
        );
        return res.status(200).json({
            success: true,
            message: 'You have successfully reset your password...',
        });
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async test(@Res() res) {
        return res.status(200).json({
            success: true,
            message: `Welcome To Our Page...oooooooooooo`,
        });
    }



    // @Public()
    // @HttpCode(HttpStatus.OK)
    // @UseGuards(LocalAuthGuard)
    // @Post('login')
    // async logins(@Request() req) 
    // {
    //     return this.authService.login(req.user.id);
    //     //return {id:req.user.id, token}
    // }


    // @UseGuards(RefreshAuthGuard)
    // @Post('refresh')
    // refreshTokens(@Req() req) 
    // {
    //     return this.authService.refreshToken(req.user.id);
    // }
}
