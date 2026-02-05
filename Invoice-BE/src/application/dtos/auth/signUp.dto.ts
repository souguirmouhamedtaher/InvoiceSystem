import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SignUpDto {
    @ApiProperty({ description: 'Name of the user', example: 'louay', required: true })
    @IsString()
    firstName: string;

    @ApiProperty({ description: 'last Name of the user', example: 'elaroui', required: true })
    @IsString()
    lastName: string;

    @ApiProperty({ description: 'Email of the user', example: 'test@gmail.com', required: true })
    @IsString()
    email: string;


    @ApiProperty({ description: 'phone number', example: '50740663', required: true })
    @IsString()
    phone: string;

    @ApiProperty({ description: 'Password of the user', example: 'test1235@', required: true })
    @IsString()
    password: string;



    @ApiPropertyOptional()
    @IsString()
    avatar: string;



    @ApiProperty()
    @IsString()
    birthday: Date;
}