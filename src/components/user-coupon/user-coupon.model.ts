import { Schema, model, Types } from 'mongoose'

interface IRedemption {
  redeemedAt: Date
  transactionId?: Types.ObjectId
}

interface IUserCoupon {
  userId: Types.ObjectId
  couponId: Types.ObjectId
  couponBookId: Types.ObjectId
  code: string
  assignedAt: Date
  redemptions: IRedemption[]
  createdAt?: Date
  updatedAt?: Date
}

const redemptionSchema = new Schema<IRedemption>(
  {
    redeemedAt: {
      type: Date,
      required: true,
    },
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
    },
  },
  { _id: false },
)

const userCouponSchema = new Schema<IUserCoupon>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    couponId: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon',
      required: true,
    },
    couponBookId: {
      type: Schema.Types.ObjectId,
      ref: 'CouponBook',
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    assignedAt: {
      type: Date,
      required: true,
    },
    redemptions: [redemptionSchema],
  },
  {
    timestamps: true,
  },
)

userCouponSchema.index({ userId: 1, couponBookId: 1 })
userCouponSchema.index({ code: 1, userId: 1 }, { unique: true })

export const UserCouponModel = model<IUserCoupon>('UserCoupon', userCouponSchema)
