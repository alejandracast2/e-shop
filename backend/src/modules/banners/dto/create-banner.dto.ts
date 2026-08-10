import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

const normalizeNullableString = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const trimRequiredString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateBannerDto {
  @Transform(trimRequiredString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title: string;

  @Transform(normalizeNullableString)
  @IsOptional()
  @IsString()
  subtitle?: string | null;

  @Transform(trimRequiredString)
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_protocol: true, require_tld: false })
  imageUrl: string;

  @Transform(normalizeNullableString)
  @IsOptional()
  @IsUrl({ require_protocol: true, require_tld: false })
  mobileImageUrl?: string | null;

  @Transform(normalizeNullableString)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  ctaLabel?: string | null;

  @Transform(normalizeNullableString)
  @IsOptional()
  @Matches(/^(\/(?!\/)\S*|https?:\/\/\S+)$/i, {
    message: 'ctaUrl must be an internal path or an HTTP(S) URL',
  })
  ctaUrl?: string | null;

  @Transform(normalizeNullableString)
  @IsOptional()
  @IsString()
  @MaxLength(240)
  altText?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Transform(normalizeNullableString)
  @IsOptional()
  @IsDateString()
  startsAt?: string | null;

  @Transform(normalizeNullableString)
  @IsOptional()
  @IsDateString()
  endsAt?: string | null;
}
