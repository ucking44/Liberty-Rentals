import { IsString, IsStrongPassword, MinLength } from 'class-validator';

export class ChangePasswordDto {
    @IsString()
    oldPassword: string;

    @MinLength(8)
    @IsStrongPassword(undefined, {
        message: 'Password Must Contain At Least One Special Character, Uppercase and Number',
    })
    @IsString()
    newPassword: string;
}
