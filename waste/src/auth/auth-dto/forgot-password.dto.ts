import { IsEmail, IsNotEmpty, IsOptional, IsString, IsStrongPassword } from 'class-validator';

export class ForgotPasswordDto {
    @IsOptional()
    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    phone: string;
}
