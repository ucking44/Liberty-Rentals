import { Role } from 'src/enums/role.enum';

export type CreateUserParams = {
    firstName: string;

    lastName: string;

    middleName?: string;

    email?: string;

    phone?: string;

    username?: string;

    password: string;

    role: Role;
};

export type UpdateUserParams = {
    firstName?: string;

    lastName?: string;

    middleName?: string;

    email?: string;

    phone?: string;

    username?: string;

    password?: string;

    role?: Role;
};
