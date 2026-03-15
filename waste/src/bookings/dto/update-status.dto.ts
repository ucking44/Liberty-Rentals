import { IsEnum } from 'class-validator';
import { BookingStatus } from 'src/enums/bookingStatus.enum';

export class UpdateBookingStatusDto 
{
    @IsEnum(BookingStatus)
    status: BookingStatus;
}
