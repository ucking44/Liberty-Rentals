import { JwtModuleOptions } from '@nestjs/jwt';
import { registerAs } from '@nestjs/config';
import { StringValue } from 'ms';

export default registerAs('jwt', (): JwtModuleOptions => ({
    secret: process.env.JWT_SECRET as string,
    signOptions: {
        expiresIn: process.env.JWT_EXPIRE_IN as StringValue,
    },
}));
