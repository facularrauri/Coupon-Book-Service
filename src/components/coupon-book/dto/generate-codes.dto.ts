import { IsNumber, Min, IsNotEmpty, IsString } from 'class-validator'

export class GenerateCodesDTO {
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity!: number

  @IsString()
  @IsNotEmpty()
  couponBookId!: string
}
