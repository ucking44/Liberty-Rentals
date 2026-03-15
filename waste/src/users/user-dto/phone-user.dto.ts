import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateUserPhoneDto {
    @IsNotEmpty()
    phone: string;

    @IsNotEmpty()
    password: string;
}
