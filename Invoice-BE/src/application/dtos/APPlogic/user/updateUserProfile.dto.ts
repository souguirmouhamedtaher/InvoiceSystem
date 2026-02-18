import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserProfileDto {
    @ApiProperty({ description: 'Phone number' })
    @IsString()
    @IsNotEmpty()
    phone: string;
}
