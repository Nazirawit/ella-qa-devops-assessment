import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransactionDto {
  @Type(() => Number)
  @IsInt()
  userId: number;

  @Type(() => Number)
  @IsInt()
  productId: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}
