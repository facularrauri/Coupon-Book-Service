import { IsString, IsNotEmpty } from 'class-validator'

export class AssignRandomCouponDTO {
  @IsString()
  @IsNotEmpty()
  userId!: string

  @IsString()
  @IsNotEmpty()
  couponBookId!: string
}
