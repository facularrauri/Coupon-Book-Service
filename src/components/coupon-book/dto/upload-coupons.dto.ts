import { IsArray, ArrayNotEmpty, IsNotEmpty, IsString } from 'class-validator'

export class UploadCouponsDTO {
  @IsArray()
  @ArrayNotEmpty()
  @IsNotEmpty()
  codes!: string[]

  @IsString()
  @IsNotEmpty()
  couponBookId!: string
}
