import { Role } from 'src/enums/role.enum';

export type CurrentUser = {
    id: number;
    firstName: string;
    lastName: string;
    middleName: string;
    email: string;
    phone: string;
    username: string;
    role: Role;
};
