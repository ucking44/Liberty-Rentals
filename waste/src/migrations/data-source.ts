import * as dotenv from 'dotenv';
dotenv.config();
//import config from 'src/typeorm.config';
import typeOrmConfig from '../typeorm.config';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource(typeOrmConfig);
