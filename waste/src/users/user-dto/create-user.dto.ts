import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsStrongPassword, MinLength } from 'class-validator';
import { Role } from 'src/enums/role.enum';
import { IsUnique } from 'src/validation/is-unique';

const name = 'users';

export class CreateUserDto {
    //@Validate(IsUniqueConstraint)
    @IsNotEmpty({ message: 'First Name Field Is Required!' })
    @IsString()
    firstName: string;

    @IsNotEmpty({ message: 'Last Name Field Is Required!' })
    @IsString()
    lastName: string;

    @IsOptional()
    @IsString()
    middleName?: string;

    @IsUnique({ tableName: name, column: 'email', message: 'Email Already Exists' })
    @IsEmail()
    @IsNotEmpty({ message: 'Email Field Is Required!' })
    email: string;

    @IsUnique({ tableName: name, column: 'phone', message: 'Phone Already Exists' })
    //@IsNotEmpty({ message: 'Phone Field Is Required!' })
    @IsOptional()
    phone: string;

    @IsUnique({ tableName: name, column: 'username', message: 'Username Already Exists' })
    @IsNotEmpty({ message: 'Username Field Is Required!' })
    @IsString()
    username: string;

    @MinLength(8)
    @IsNotEmpty({ message: 'Password Field Is Required!' })
    @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
    { message: 'Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.' })
    //@IsStrongPassword(undefined, { message: 'Password Must Contain At Least One Special Character, Uppercase and Number' })
    password: string;

    @IsEnum(Role, { message: 'Invalid role provided' })
    role: Role;

    @IsOptional()
    @IsString()
    displayName?: string;

    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    @IsString()
    avatarUrl?: string;
}
