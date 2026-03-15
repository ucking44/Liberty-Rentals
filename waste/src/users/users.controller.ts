import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, Query, Req, Res, Response, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './user-dto/create-user.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { Role } from 'src/enums/role.enum';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Public } from 'src/auth/decorator/public.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';

//@Roles(Role.USER)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Public()
    @Post('register-user')
    async createUser(@Res() res, @Body() createUserDto: CreateUserDto) {
        const newUser = await this.usersService.create(createUserDto);

        if (!newUser) {
            return res.status(500).json({
                success: false,
                message: 'Ooopsss! Something Went Wrong!',
            });
        } else {
            return res.status(201).json({
                success: true,
                message: 'User Was Created Successfully!',
                data: newUser,
            });
        }
    }

    //@UseGuards(RolesGuard)
    @Public()
    @Post('register')
    @UseInterceptors(
        FileInterceptor('avatar', {
            storage: diskStorage({
                destination: './uploads/avatars',
                filename: (req, file, cb) => {
                    const ext = extname(file.originalname);
                    const filename = `${uuidv4()}${ext}`;
                    cb(null, filename);
                },
            }),
            fileFilter: (req, file, cb) => {
                if (!file) 
                {
                    cb(null, false); // No file is OK
                } 
                else if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) 
                {
                    cb(new Error('Only image files are allowed!'), false);
                } 
                else 
                {
                    cb(null, true);
                }
            },
        }),
    )
    async create(@Res() res, @UploadedFile() file: Express.Multer.File, @Body() createUserDto: CreateUserDto) 
    {
        if (file) 
        {
            createUserDto.avatarUrl = `/uploads/avatars/${file.filename}`;
        }

        createUserDto.email = createUserDto.email.toLowerCase();
        createUserDto.username = createUserDto.username.toLowerCase();

        const emailExists = await this.usersService.emailExists(createUserDto.email);
        const phoneExists = await this.usersService.phoneExists(createUserDto.phone);
        const usernameExists = await this.usersService.usernameExists(createUserDto.username);

        if (emailExists) 
        {
            return res.status(400).json({
                success: false,
                message: 'User With This Email Already Exists',
            });
        }

        if (phoneExists) 
        {
            return res.status(400).json({
                success: false,
                message: 'User With This Phone Already Exists',
            });
        }

        if (usernameExists) 
        {
            return res.status(400).json({
                success: false,
                message: 'User With This Username Already Exists',
            });
        }

        const newUser = await this.usersService.create(createUserDto);

        if (!newUser) 
        {
            return res.status(500).json({
                success: false,
                message: 'Ooopsss! Something Went Wrong!',
            });
        }

        return res.status(201).json({
            success: true,
            message: 'User Was Created Successfully!',
            data: newUser,
        });
    }

    @Roles(Role.ADMIN)
    @Post('moderate-create-user')
    async moderateCreateUser(@Res() res, @Body() createUserDto: CreateUserDto) 
    {
        const newUser = await this.usersService.create(createUserDto);

        if (!newUser) 
        {
            return res.status(500).json({
                success: false,
                message: 'Ooopsss! Something Went Wrong!',
            });
        } 
        else 
        {
            return res.status(201).json({
                success: true,
                message: 'User Was Created Successfully!',
                data: newUser,
            });
        }
    }

    @UseGuards(JwtAuthGuard)
    @Get('profile')
    async getProfile(@Req() req, @Res() res) 
    {
        const profile = await this.usersService.findById(req.user.id);

        if (!profile || profile.hashedRefreshToken === null) 
        {
            return res.status(400).json({
                success: false,
                message: 'You Need To Login Before You Can Access This Resource',
            });
        } 
        else 
        {
            return res.status(200).json({
                success: true,
                data: profile,
            });
        }
    }

    @Public()
    @Get('all-users')
    async getAllUsers(@Response() res) 
    {
        const allUsers = await this.usersService.fetchAllUsers();

        if (allUsers.length !== 0) 
        {
            return res.status(200).json({
                status: true,
                data: allUsers,
            });
        } 
        else 
        {
            return res.status(404).json({
                status: false,
                message: 'No User Was Found!',
            });
        }
    }

    @Public()
    @Get('get-moderators')
    async getModerators(@Response() res) 
    {
        const moderators = await this.usersService.getModeratorUsers();

        if (moderators.length !== 0) 
        {
            return res.status(200).json({
                status: true,
                data: moderators,
            });
        } 
        else 
        {
            return res.status(404).json({
                status: false,
                message: 'No Moderator Was Found!',
            });
        }
    }

    @Public()
    @Get('fetch-moderators')
    async fetchModerators(@Response() res, @Query('page') page = 1, @Query('limit') limit = 10, @Query('search') search?: string) 
    {
        const result = await this.usersService.fetchModeratorUsers(+page, +limit, search);

        if (result.data.length > 0) 
        {
            return res.status(200).json({
                status: true,
                data: result.data,
                meta: {
                    total: result.total,
                    page: result.page,
                    pageCount: result.pageCount,
                },
            });
        } 
        else 
        {
            return res.status(404).json({
                status: false,
                message: 'No Moderator Was Found!',
            });
        }
    }

    @Get('/:id')
    async show(@Res() res, @Param('id', ParseIntPipe) id: number) 
    {
        const userById = await this.usersService.showById(id);

        if (!userById) 
        {
            return res.status(500).json({
                success: false,
                message: 'Ooopsss! Something Went Wrong!',
            });
        } 
        else 
        {
            return res.status(200).json({
                success: true,
                data: userById,
            });
        }
    }

    @Public()
    @Get('/directors')
    async fetchDirectors(@Response() res) 
    {
        const allDirectors = await this.usersService.getAllDirector();

        if (allDirectors.length !== 0) 
        {
            return res.status(200).json({
                status: true,
                data: allDirectors,
            });
        } 
        else 
        {
            return res.status(404).json({
                status: false,
                message: 'No Director Was Found!',
            });
        }
    }

    @Public()
    @Get('/all-directors')
    async getDirectorsWithPagination(@Query('page') page: number = 1, @Query('limit') limit: number = 10) 
    {
        const pageNumber = Number(page) || 1;
        const pageSize = Number(limit) || 10;

        return this.usersService.getDirectorsWithPagination(pageNumber, pageSize);
    }

    //@SetMetadata('role', [Role.ADMIN])
    @Roles(Role.ADMIN, Role.MANAGER)
    //@Roles(Role.ADMIN, Role.EDITOR)
    // @UseGuards(RolesGuard)
    // @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async remove(@Param('id') id: string) 
    {
        return this.usersService.remove(+id);
    }

    @Put('update/:id')
    async updateUser(@Param('id', ParseIntPipe) id: number, @Body() updateUserParams: any, @Res() res) 
    {
        const updatedUser = await this.usersService.updateUser(id, updateUserParams);

        if (!updatedUser) 
        {
            return res.status(500).json({
                success: false,
                message: 'Ooopsss! Something Went Wrong!',
            });
        } 
        else 
        {
            return res.status(200).json({
                success: true,
                message: 'User Was Updated Successfully!',
                data: updatedUser,
            });
        }
    }

    @Roles(Role.ADMIN)
    @Delete('delete-moderator/:id')
    async removeModerator(@Param('id', ParseIntPipe) id: number, @Response() res) 
    {
        const deleteModerator = await this.usersService.removeModerator(id);

        if (deleteModerator.affected !== 0) 
        {
            return res.status(200).json({
                success: true,
                message: 'User Was Deleted Successfully!',
            });
        } 
        else 
        {
            return res.status(404).json({
                success: false,
                message: `Moderator User With The ID Of ${id} Was Not Found!`,
            });
        }
    }
}
