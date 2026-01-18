import { PartialType } from '@nestjs/mapped-types';
import { CreateVariantDto } from './create-product.dto';

export class UpdateVariantDto extends PartialType(CreateVariantDto) {}
