import { Schema, model, Types } from 'mongoose'
import MongooseDelete, { SoftDeleteModel, SoftDeleteDocument } from 'mongoose-delete'

interface ICouponBook {
  _id: Types.ObjectId
  name: string
  description?: string
  startDate: Date
  endDate: Date
  isActive: boolean
  maxRedemptionsPerUser: number
  maxCodesPerUser: number
  allowMultipleRedemptions: boolean
  totalCodes: number
  codePattern?: string
}

export interface ICouponBookDocument extends ICouponBook, SoftDeleteDocument {
  _id: Types.ObjectId
}

const couponBookSchema = new Schema<ICouponBookDocument>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    maxRedemptionsPerUser: { type: Number, default: 1 },
    maxCodesPerUser: { type: Number, default: 1 },
    allowMultipleRedemptions: { type: Boolean, default: false },
    totalCodes: { type: Number, required: true, default: 0 },
    codePattern: { type: String },
  },
  {
    timestamps: true,
  },
)

couponBookSchema.plugin(MongooseDelete, { deletedAt: true, deletedBy: true, overrideMethods: true })

couponBookSchema.index({ isActive: 1 })
couponBookSchema.index({ startDate: 1, endDate: 1 })

export const CouponBookModel = model<ICouponBookDocument, SoftDeleteModel<ICouponBookDocument>>(
  'CouponBook',
  couponBookSchema,
)
