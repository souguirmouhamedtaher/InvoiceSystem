import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { Role } from 'src/domain/enums/role.enums';

export class CreateUserDto {
    @ApiProperty()
    @IsString()
    firstName: string;

    @ApiProperty()
    @IsString()
    lastName: string;

    @ApiProperty()
    @IsString()
    email: string;


    @ApiProperty()
    @IsString()
    phone: string;

    @ApiProperty()
    @IsString()
    idNumber: string;

    @ApiPropertyOptional()
    @IsString()
    avatar: string;



    @ApiProperty()
    @IsEnum(Role)
    role: Role[];



    @ApiProperty()
    @IsString()
    birthday: Date;


}