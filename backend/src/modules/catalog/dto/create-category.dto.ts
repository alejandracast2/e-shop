import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUrl } from 'class-validator';

const normalizeNullableString = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @Transform(normalizeNullableString)
  @IsOptional()
  @IsString()
  parentId?: string | null;

  @Transform(normalizeNullableString)
  @IsOptional()
  @IsString()
  path?: string | null;

  @Transform(normalizeNullableString)
  @IsOptional()
  @IsUrl({ require_protocol: true, require_tld: false })
  imageUrl?: string | null;

  @IsOptional()
  @IsInt()
  position?: number;
}
