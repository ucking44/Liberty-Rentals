import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CustomerProfile } from './customer-profile.entity';
import { User } from '../users/user.entity';
import { Role } from 'src/enums/role.enum';
import { CreateCustomerProfileDto } from './create-customer-profile.dto';
import { UpdateCustomerProfileDto } from './update-customer-profile.dto';

@Injectable()
export class CustomerProfileService 
{
    constructor(@InjectRepository(CustomerProfile) private readonly profileRepository: Repository<CustomerProfile>,
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        private readonly dataSource: DataSource,
    ) {}

    async create(userId: number, dto: CreateCustomerProfileDto): Promise<CustomerProfile> 
    {
        return await this.dataSource.transaction(async (manager) => {
            const user = await manager.findOne(User, {
                where: { id: userId },
            });

            if (!user) 
            {
                throw new NotFoundException('User not found');
            }

            // if (user.role !== Role.CUSTOMER && user.role !== Role.USER) 
            if (user.role !== Role.CUSTOMER)
            {
                throw new BadRequestException('Only customers can have customer profiles');
            }

            const existing = await manager.findOne(CustomerProfile, {
                where: { user_id: userId },
            });

            if (existing) 
            {
                throw new ConflictException('Customer profile already exists');
            }

            const profile = manager.create(CustomerProfile, {
                ...dto,
                user_id: userId,
            });

            return await manager.save(profile);
        });
    }

    async getProfile(userId: number): Promise<CustomerProfile>
    {
        const profile = await this.dataSource.getRepository(CustomerProfile)
            .createQueryBuilder('profile')
            .leftJoinAndSelect('profile.user', 'user')
            .where('profile.user_id = :userId', { userId })
            .getOne();

        if (!profile)
        {
            throw new NotFoundException('Profile not found');
        }

        return profile;
    }

    async findByUser(userId: number): Promise<CustomerProfile> 
    {
        const profile = await this.profileRepository.findOne({
            where: { user_id: userId },
            relations: ['user'],
        });

        if (!profile) 
        {
            throw new NotFoundException('Customer profile not found');
        }

        return profile;
    }

    async update(userId: number, dto: UpdateCustomerProfileDto): Promise<CustomerProfile> 
    {
        const profile = await this.findByUser(userId);

        Object.assign(profile, dto);

        return await this.profileRepository.save(profile);
    }

    async remove(userId: number): Promise<void> 
    {
        const profile = await this.findByUser(userId);
        await this.profileRepository.softRemove(profile);
    }
}
