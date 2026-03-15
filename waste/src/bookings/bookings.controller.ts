import { Controller, Post, Body, Param, Patch, Get, Req } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { AssignBookingDto } from './dto/assign-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-status.dto';


@Controller('bookings')
export class BookingsController 
{
    constructor(private readonly bookingsService: BookingsService) {}

    @Post()
    create(@Req() req, @Body() dto: CreateBookingDto) 
    {
        return this.bookingsService.create(req.user.id, dto);
    }

    @Patch(':id/assign')
    assign(@Param('id') id: string, @Body() dto: AssignBookingDto) 
    {
        return this.bookingsService.assign(id, dto);
    }

    @Patch(':id/status')
    updateStatus(@Param('id') id: string, @Req() req, @Body() dto: UpdateBookingStatusDto) 
    {
        return this.bookingsService.updateStatus(id, req.user.id, dto);
    }

    @Patch(':id/cancel')
    cancel(@Param('id') id: string) 
    {
        const userId = 1; // Replace with Auth
        //const userId = req.user.id; // Use authenticated user ID
        return this.bookingsService.cancelBooking(id, userId);
    }

    @Get('customer-bookings')
    customerBookings(@Req() req) 
    {
        return this.bookingsService.findCustomerBookings(req.user.id);
    }

    @Get('partner-bookings/:partnerId')
    partnerBookings(@Param('partnerId') partnerId: string)
    {
        return this.bookingsService.findPartnerBookings(partnerId);
    }

    @Get()
    findAll() 
    {
        return this.bookingsService.findAll();
    }

    @Get('available-bookings')
    getAvailableBookings() 
    {
        return this.bookingsService.getAvailableBookings();
    }
}
