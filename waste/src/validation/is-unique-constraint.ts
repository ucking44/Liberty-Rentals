import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { IsUniqueConstraintInput } from './is-unique';
import { DataSource, EntityManager } from 'typeorm';
import { Injectable } from '@nestjs/common';

@ValidatorConstraint({ name: 'IsUniqueConstraint', async: true })
@Injectable()
export class IsUniqueConstraint implements ValidatorConstraintInterface {
    constructor(private readonly dataSource: DataSource) {}

    async validate(value: any, args?: ValidationArguments): Promise<boolean> 
    {
        if (!args || !args.constraints || !args.constraints[0]) 
        {
            return false;
        }
        const { tableName, column }: IsUniqueConstraintInput = args.constraints[0];

        const exists = await this.dataSource
            .getRepository(tableName)
            .createQueryBuilder(tableName)
            .where({ [column]: value })
            .getExists();

        return exists ? false : true;
    }

    defaultMessage(validationArguments?: ValidationArguments): string {
        if (validationArguments && validationArguments.constraints && validationArguments.constraints[0]) 
        {
            const { message }: IsUniqueConstraintInput = validationArguments.constraints[0];
            return message;
        }
        return 'Value is not unique';
    }
}
