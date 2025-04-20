import { IsInt } from 'class-validator';

export class AnalyzeSubDTO {
  @IsInt()
  sub_id: number;

  @IsInt()
  user_id: number;
}
