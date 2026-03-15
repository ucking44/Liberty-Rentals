import { JwtSignOptions } from '@nestjs/jwt';
import { registerAs } from '@nestjs/config';
import { StringValue } from 'ms';

export default registerAs('refresh-jwt', (): JwtSignOptions => ({
    secret: process.env.REFRESH_JWT_SECRET as string,
    expiresIn: process.env.REFRESH_JWT_EXPIRE_IN as StringValue,
}));
