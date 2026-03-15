import { IsEmail, IsNotEmpty, IsString, IsStrongPassword, MinLength } from 'class-validator';
import { IsUnique } from 'src/validation/is-unique';

const name = 'users';

export class EmailLoginDto {
    @IsUnique({ tableName: name, column: 'email', message: 'Email Alread Exists' })
    @IsEmail()
    @IsNotEmpty({ message: 'Email Field Is Required!' })
    email: string;

    @MinLength(8)
    @IsStrongPassword(undefined, {
        message: 'Password Must Contain At Least One Special Character, Uppercase and Number',
    })
    @IsString()
    @IsNotEmpty({ message: 'Password Field Is Required!' })
    password: string;
}
