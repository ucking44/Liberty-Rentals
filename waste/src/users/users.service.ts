import { Injectable, Logger } from '@nestjs/common';
import { User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { CreateUserParams, UpdateUserParams } from 'src/utils/user/user_types';
import { Role } from 'src/enums/role.enum';


@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);
    constructor(@InjectRepository(User) private readonly userRepo: Repository<User>,
        private readonly dataSource: DataSource
    ) {}

    async updateHashedRefreshToken(userId: number, hashedRefreshToken: string) 
    {
        return await this.userRepo.update({ id: userId }, { hashedRefreshToken });
    }

    async create(createUserDto: CreateUserParams) 
    {
        const user = await this.dataSource.transaction(async (manager) => {
            const user = manager.create(User, createUserDto);
            await manager.save(user);
            delete user.password;
            return user;
        })

        const fullName = `${user.firstName} ${user.lastName}`;

        try 
        {
            //await this.welcomeService.welcomeEmail(user.email, fullName)
        } 
        catch (error) 
        {
            this.logger.error('Error sending welcome email', error);
        }

        return user;
    }

    async fetchAllUsers() 
    {
        const allUsers = await this.userRepo.find({ where: { role: Role.USER } });
        return allUsers;
    }

    async getModeratorUsers() 
    {
        const moderators = await this.userRepo.find({
            where: {
                role: In([Role.ADMIN, Role.MANAGER, Role.DIRECTOR]),
            },
            select: ['id', 'firstName', 'lastName', 'email', 'phone', 'username', 'role'],
        });

        return moderators;
    }

    async fetchModeratorUsers(page = 1, limit = 10, search?: string) 
    {
        const skip = (page - 1) * limit;

        const query = this.userRepo
            .createQueryBuilder('user')
            .where('user.role IN (:...roles)', {
                roles: [Role.ADMIN, Role.MANAGER, Role.DIRECTOR],
            })
            .select([
                'user.id',
                'user.firstName',
                'user.lastName',
                'user.email',
                'user.phone',
                'user.username',
                'user.role',
            ])
            .skip(skip)
            .take(limit);

        if (search) 
        {
            const lowerSearch = `%${search.toLowerCase()}%`;
            query.andWhere(
                `(LOWER(user.firstName) LIKE :search OR LOWER(user.lastName) LIKE :search OR LOWER(user.email) LIKE :search OR LOWER(user.username) LIKE :search)`,
                { search: lowerSearch },
            );
        }

        const [data, total] = await query.getManyAndCount();

        return {
            data,
            total,
            page,
            pageCount: Math.ceil(total / limit),
        };
    }

    async showById(id: number) 
    {
        //: Promise<User>
        const user = await this.findById(id);

        if (user) 
        {
            delete user.password;
        }

        //delete user.password
        return user;
    }

    async findById(id: number) 
    {
        //return await User.findOne(id)
        const user = await this.userRepo.findOne({
            where: { id: id },
            select: ['id', 'email', 'hashedRefreshToken', 'role', 'password'],
        });
        return user;
    }

    async findUserDetails(id: number) 
    {
        const userDetails = await this.userRepo.findOne({
            where: { id: id },
            select: ['id', 'firstName', 'lastName', 'middleName', 'email', 'phone', 'username', 'role'],
        });
        return userDetails;
    }

    async findDirectors() 
    {
        const director = await this.userRepo.find({ where: { role: Role.DIRECTOR } });
        return director;
    }

    async getAllDirector(): Promise<User[]> 
    {
        const fetchdirector = await this.userRepo
            .createQueryBuilder('user')
            .where('user.role = :role', { role: Role.DIRECTOR })
            .getMany();
        return fetchdirector;
    }

    async getDirectorsWithPagination(page: number, limit: number): Promise<{ data: User[]; total: number }> 
    {
        const [data, total] = await this.userRepo.findAndCount({
            where: { role: Role.DIRECTOR },
            //relations: ['orders', 'payments', 'subscriptions'],
            take: limit,
            skip: (page - 1) * limit,
        });

        return { data, total };
    }

    async findByEmail(email: string) 
    {
        const userEmail = await this.userRepo.findOne({ where: { email: email } });
        //const byEmail = await User.findOne({ where: { email: email } })
        return userEmail;
    }

    async findUserByEmail(email: string) 
    {
        const userEmail = await this.userRepo.findOne({
            where: { email: email },
            select: ['id', 'firstName', 'lastName', 'email', 'phone', 'username', 'role'],
        });
        return userEmail;
    }

    async findByPhone(phone: string) 
    {
        const userPhone = await this.userRepo.findOne({ where: { phone: phone } });
        return userPhone;
    }

    async remove(id: number) 
    {
        return this.userRepo.delete(id);
    }

    async updateLastLogins(userId: number, ip?: string | null, device?: string | null): Promise<void> 
    {
        await this.userRepo.update(userId, {
            last_login_at: new Date(),
            last_login_ip: ip ?? null,
            last_login_device: device ?? null,
        });
    }

    async updateLastLogin(userId: number, ip?: string | null, device?: string | null): Promise<void>
    {
        await this.dataSource
            .createQueryBuilder()
            .update(User)
            .set({
                last_login_at: () => 'CURRENT_TIMESTAMP',
                last_login_ip: ip ?? null,
                last_login_device: device ?? null
            })
            .where('id = :id', { id: userId })
            .execute();
    }

    async updateLogoutTime(userId: number): Promise<void> 
    {
        await this.dataSource
            .createQueryBuilder()
            .update(User)
            .set({
                last_logout_at: () => 'CURRENT_TIMESTAMP'
            })
            .where('id = :id', { id: userId })
            .execute();
    }

    async updateUser(id: number, updateUserParams: UpdateUserParams) 
    {
        const user = await this.userRepo.findOne({ where: { id: id } });

        if (!user) 
        {
            return null;
        }

        if (updateUserParams.password) 
        {
            const hashedPassword = await bcrypt.hash(updateUserParams.password, 10);
            updateUserParams.password = hashedPassword;
        }

        await this.userRepo.update(id, updateUserParams);
        const updatedUser = await this.userRepo.findOne({ where: { id: id } });

        if (updatedUser) 
        {
            delete updatedUser.password;
        }
        //delete updatedUser.password
        return updatedUser;
    }

    async removeModerator(id: number) 
    {
        const deleteModerator = await this.userRepo.delete(id);
        return deleteModerator;
    }

    async emailExists(email: string) 
    {
        const userEmail = await this.userRepo.findOne({ where: { email: email } });
        //return userEmail ? true : false;
        return userEmail;
    }

    async phoneExists(phone: string) 
    {
        const userPhone = await this.userRepo.findOne({ where: { phone: phone } });
        return userPhone;
    }

    async usernameExists(username: string) 
    {
        //: Promise<boolean>
        const userUsername = await this.userRepo.findOne({ where: { username: username } });
        //return !!user;
        return userUsername;
    }

    // users.service.ts
    // async updatePaystackDetails(userId: number, details: { paystack_customer_code: string; paystack_authorization_code: string }): Promise<void>
    // {
    //     await this.userRepo.update(userId, {
    //         paystack_customer_code: details.paystack_customer_code,
    //         paystack_authorization_code: details.paystack_authorization_code,
    //     });
    // }
}
