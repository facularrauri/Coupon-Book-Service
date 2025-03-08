import { Schema, model, Types } from 'mongoose'

type TransactionAction = 'assign' | 'lock' | 'redeem' | 'unlock'
type TransactionStatus = 'success' | 'failed' | 'pending'

interface ITransaction {
  userId: Types.ObjectId
  couponId: Types.ObjectId
  couponBookId: Types.ObjectId
  code: string
  action: TransactionAction
  status: TransactionStatus
  metadata?: Record<string, any>
  createdAt?: Date
  updatedAt?: Date
}

const transactionSchema = new Schema<ITransaction>(
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
    action: {
      type: String,
      enum: ['assign', 'lock', 'redeem', 'unlock'],
      required: true,
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'pending'],
      required: true,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  },
)

transactionSchema.index({ userId: 1, action: 1 })
transactionSchema.index({ code: 1, action: 1 })
transactionSchema.index({ createdAt: 1 })

export const TransactionModel = model('Transaction', transactionSchema)
