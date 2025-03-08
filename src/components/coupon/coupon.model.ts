import { Schema, model, Types } from 'mongoose'

export interface ICoupon {
  _id: Types.ObjectId
  couponBookId: Types.ObjectId
  code: string
  isAssigned: boolean
  isRedeemed: boolean
  redemptionCount: number
  lockedUntil: Date
  createdAt: Date
  updatedAt: Date
}

const couponSchema = new Schema<ICoupon>(
  {
    couponBookId: {
      type: Schema.Types.ObjectId,
      ref: 'CouponBook',
      required: true,
    },
    code: { type: String, required: true, unique: true, trim: true },
    isAssigned: { type: Boolean, default: false },
    isRedeemed: { type: Boolean, default: false },
    redemptionCount: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
)

couponSchema.index({ couponBookId: 1, isAssigned: 1 })
couponSchema.index({ couponBookId: 1, isRedeemed: 1 })

export const CouponModel = model<ICoupon>('Coupon', couponSchema)
