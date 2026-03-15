import { DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const typeOrmConfig: DataSourceOptions = {
    type: 'mysql',
    host: process.env.DB_HOST as string,
    port: parseInt(process.env.DB_PORT ?? '3306', 10),
    username: process.env.DB_USERNAME as string,
    password: process.env.DB_PASSWORD as string,
    database: process.env.DB_NAME as string,
    entities: ['dist/**/*.entity.js'],
    migrations: ['dist/migrations/*.js'],
    //migrations: [__dirname + '/migrations/*.migration.{ts,js}'],
    // migrations: [
    //     process.env.NODE_ENV === 'production'
    //     ? 'dist/migrations/*.{js}'
    //     : 'src/migrations/*.{ts}'
    // ]
    synchronize: false, // NEVER true when using migrations
};


export default typeOrmConfig;
