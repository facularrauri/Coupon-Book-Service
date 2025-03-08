import { IsString, IsNotEmpty } from 'class-validator'

export class LockCouponDTO {
  @IsString()
  @IsNotEmpty()
  userId!: string
}
