import { IsInt, IsDateString, IsOptional } from 'class-validator';

export class UserCardActionDto {
  @IsInt()
  user_id: number;

  @IsInt()
  card_id: number;

  @IsOptional()
  @IsDateString()
  date_start: string;

  @IsOptional()
  @IsInt()
  period: number;
}
