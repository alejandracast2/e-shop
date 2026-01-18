import { IsInt, Min } from 'class-validator';

export class SetStockDto {
  @IsInt()
  @Min(0)
  onHand: number;
}
