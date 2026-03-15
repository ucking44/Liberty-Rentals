import { IsEnum, IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { CustomerType } from 'src/enums/customerType.enum';

export class CreateCustomerProfileDto 
{
    @IsEnum(CustomerType)
    customer_type: CustomerType;

    @IsOptional()
    @IsString()
    business_name?: string;

    @IsOptional()
    @IsString()
    address_line_1?: string;

    @IsOptional()
    @IsString()
    address_line_2?: string;

    @IsNotEmpty({ message: 'City is required' })
    @IsString()
    city: string;

    @IsNotEmpty({ message: 'State is required' })
    @IsString()
    state: string;

    @IsOptional()
    @IsNumber()
    latitude?: number;

    @IsOptional()
    @IsNumber()
    longitude?: number;
}
