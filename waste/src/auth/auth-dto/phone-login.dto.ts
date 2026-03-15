import { IsNotEmpty } from 'class-validator';
import { IsUnique } from 'src/validation/is-unique';

const name = 'users';

export class PhoneLoginDto {
    @IsUnique({ tableName: name, column: 'phone', message: 'Phone Alread Exists' })
    @IsNotEmpty({ message: 'Phone Field Is Required!' })
    phone: string;

    @IsNotEmpty({ message: 'Password Field Is Required!' })
    password: string;
}
