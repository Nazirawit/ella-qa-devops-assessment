import { IsString, IsNumber, IsOptional, Min, IsEnum } from 'class-validator';
import { ProductStatus } from 'src/constants';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsEnum(ProductStatus, { message: 'Status must be a valid Product Status' })
  status?: ProductStatus;
}
