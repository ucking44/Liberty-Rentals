import { Controller, Post, Body, Get, Patch, Delete, UseGuards, Req, ParseIntPipe, Param } from '@nestjs/common';
import { CustomerProfileService } from './customer-profile.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { CreateCustomerProfileDto } from './create-customer-profile.dto';
import { UpdateCustomerProfileDto } from './update-customer-profile.dto';


@Controller('customer-profile')
@UseGuards(JwtAuthGuard)
export class CustomerProfileController 
{
    constructor(private readonly customerProfileService: CustomerProfileService) {}

    @Post()
    async create(@Req() req, @Body() dto: CreateCustomerProfileDto) 
    {
        const profile = await this.customerProfileService.create(req.user.id, dto);

        return {
            success: true,
            message: 'Customer profile created successfully',
            data: profile,
        };
    }

    @Get(':userId')
    async get(@Param('userId', ParseIntPipe) userId: number) 
    {
        const profile = await this.customerProfileService.getProfile(userId);

        return {
            success: true,
            data: profile,
        };
    }

    @Get()
    async findMyProfile(@Req() req) 
    {
        const profile = await this.customerProfileService.findByUser(req.user.id);

        return {
            success: true,
            data: profile,
        };
    }

    @Patch()
    async update(@Req() req, @Body() dto: UpdateCustomerProfileDto) 
    {
        const profile = await this.customerProfileService.update(req.user.id, dto);

        return {
            success: true,
            message: 'Customer profile updated successfully',
            data: profile,
        };
    }

    @Delete()
    async remove(@Req() req) 
    {
        await this.customerProfileService.remove(req.user.id);

        return {
            success: true,
            message: 'Customer profile deleted successfully',
        };
    }
}
