import { IsUUID, IsDateString, IsEnum, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { BookingStatus } from 'src/enums/bookingStatus.enum';

export class CreateBookingDto 
{
    @IsUUID()
    waste_type_id: string;

    @IsUUID()
    pickup_size_id: string;

    @IsUUID()
    zone_id: string;

    @IsUUID()
    slot_id: string

    @IsUUID()
    address_id: string;

    @IsDateString()
    scheduled_at: string;

    @IsString()
    @IsNotEmpty()
    start_time: string;

    @IsString()
    @IsNotEmpty()
    end_time: string;

    @IsOptional()
    @IsString()
    notes?: string;
}
