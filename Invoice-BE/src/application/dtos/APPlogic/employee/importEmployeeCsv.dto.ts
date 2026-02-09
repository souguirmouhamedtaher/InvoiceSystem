import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString } from 'class-validator';

export class ImportEmployeeCsvDto {
    @ApiProperty({ description: 'Company ID (mycompany)' })
    @IsMongoId()
    companyId: string;

    @ApiProperty({ description: 'CSV content with headers' })
    @IsString()
    csv: string;
}
