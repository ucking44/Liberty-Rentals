import { Body, Controller, HttpCode, HttpStatus, Param, Patch, Post, UseGuards, Req } from '@nestjs/common';
import { PartnersService } from './partners.service';
import { Role } from 'src/enums/role.enum';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import type { Request } from 'express';


interface AuthenticatedRequest extends Request {
    user: {
        id: number;
        role: Role;
    };
}

@Controller('partners')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PartnersController 
{
    constructor(private readonly partnersService: PartnersService) {}

    /// ADMIN — APPROVE PARTNER
    @Roles(Role.ADMIN)
    @Patch(':id/approve')
    @HttpCode(HttpStatus.OK)
    async approvePartner(@Param('id') id: string) 
    {
        return this.partnersService.approvePartner(id);
    }

    /// PARTNER — TOGGLE AVAILABILITY
    @Roles(Role.PARTNER)
    @Patch('availability')
    @HttpCode(HttpStatus.OK)
    async setAvailability(@Req() req: AuthenticatedRequest, @Body('isAvailable') isAvailable: boolean) 
    {
        return this.partnersService.setAvailability(req.user.id.toString(), isAvailable);
    }

    /// PARTNER — ACCEPT BOOKING
    @Roles(Role.PARTNER)
    @Post('bookings/:bookingId/accept')
    @HttpCode(HttpStatus.OK)
    async acceptBooking(@Req() req: AuthenticatedRequest, @Param('bookingId') bookingId: string) 
    {
        return this.partnersService.acceptBooking(req.user.id.toString(), bookingId);
    }

    /// PARTNER — COMPLETE BOOKING
    @Roles(Role.PARTNER)
    @Post('bookings/:bookingId/complete')
    @HttpCode(HttpStatus.OK)
    async completeBooking(@Req() req: AuthenticatedRequest, @Param('bookingId') bookingId: string) 
    {
        return this.partnersService.completeBooking(req.user.id.toString(), bookingId);
    }
}
