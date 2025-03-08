import { IsString, IsNotEmpty } from 'class-validator'

export class AssignCouponDTO {
  @IsString()
  @IsNotEmpty()
  userId!: string
}
