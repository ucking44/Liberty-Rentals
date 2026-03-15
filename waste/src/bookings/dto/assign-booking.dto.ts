import { IsUUID } from 'class-validator';

export class AssignBookingDto 
{
    @IsUUID()
    partner_id: string;
}
