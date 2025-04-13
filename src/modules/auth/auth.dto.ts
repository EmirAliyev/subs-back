import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'James', type: String })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiProperty({ example: 'Rodriquez', type: String })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiProperty({ example: 'james_2002', type: String })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({ example: 'url', type: String })
  @IsOptional()
  @IsString()
  photo_url?: string;

  @ApiProperty({ example: 'hash', type: String })
  @IsString()
  hash?: string;

  @ApiProperty({ example: 543245211, type: Number, required: true })
  @IsString()
  id: string;

  @ApiProperty({ example: 543245211, type: Number, })
  @IsString()
  auth_date?: number;

}
