import { Controller, Get, Patch, Post, Param, Body, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
//import { Query } from 'node_modules/mysql2/typings/mysql/lib/protocol/sequences/Query';

@Controller('admin')
export class AdminController 
{
    constructor(private readonly adminService: AdminService) {}

    @Get('dashboard')
    dashboard() 
    {
        return this.adminService.getDashboardMetrics();
    }

    @Get('bookings')
    bookings() 
    {
        return this.adminService.getAllBookings();
    }

    @Get('bookings/monitor')
    monitorBookings() 
    {
        return this.adminService.monitorBookings();
    }

    @Patch('bookings/:id/assign/:partnerId')
    assign(@Param('id') id: string, @Param('partnerId') partnerId: string) 
    {
        return this.adminService.assignBooking(id, partnerId);
    }

    @Patch('partners/:id/suspend')
    suspend(@Param('id') id: string) 
    {
        return this.adminService.suspendPartner(id);
    }

    @Patch('partners/:id/activate')
    activate(@Param('id') id: string) 
    {
        return this.adminService.activatePartner(id);
    }

    @Get('payments')
    payment(@Query() query) 
    {
        return this.adminService.listPayments(query);
    }

    @Get('payments')
    payments() 
    {
        return this.adminService.getAllPayments();
    }

    @Get('revenue')
    revenue() 
    {
        return this.adminService.getRevenueSummary();
    }

    @Get('pricing')
    pricing() 
    {
        return this.adminService.getAllPricingRules();
    }

    @Post('pricing')
    createPricing(@Body() body) 
    {
        return this.adminService.createPricingRule(body);
    }

    @Get('zones')
    zones() 
    {
        return this.adminService.getZones();
    }

    @Post('zones')
    createZone(@Body() body) 
    {
        return this.adminService.createZone(body);
    }

    @Get('tickets')
    tickets() 
    {
        return this.adminService.getAllTickets();
    }

    @Patch('tickets/:id/resolve')
    resolve(@Param('id') id: string) 
    {
        return this.adminService.resolveTicket(id);
    }

    @Get('pickups/active')
    activePickups() 
    {
        return this.adminService.getActivePickups();
    }
}
