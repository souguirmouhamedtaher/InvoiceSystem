import { ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    firstName: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    lastName: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    email: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    phone: string;


    @IsOptional()
    @ApiPropertyOptional()
    @IsString()
    birthday: Date;

    @IsOptional()
    @ApiPropertyOptional()
    @IsString()
    idNumber: string;


    @IsOptional()
    @ApiPropertyOptional()
    @IsString()
    avatar: string;


}
