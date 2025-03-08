import { IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator'

export class CreateCouponBookDTO {
  @IsString()
  name!: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  startDate!: Date

  @IsString()
  endDate!: Date

  @IsBoolean()
  @IsOptional()
  isActive?: boolean

  @IsNumber()
  @IsOptional()
  maxRedemptionsPerUser?: number

  @IsNumber()
  @IsOptional()
  maxCodesPerUsers?: number

  @IsBoolean()
  @IsOptional()
  allowMultipleRedemptions?: number

  @IsString()
  @IsOptional()
  codePattern?: string
}
