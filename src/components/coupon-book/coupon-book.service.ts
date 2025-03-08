import config from 'config'
import createError from 'http-errors'
import { IRouteServices } from 'interfaces'
import { CreateCouponBookDTO } from './dto/create-coupon-book.dto'
import { CouponBookModel, ICouponBookDocument } from './coupon-book.model'
import { Database } from '@/lib/database'
import { QUEUES, RabbitMQService } from '@/lib/rabbitMQ'
import { generateRandomCode } from '@/utils/codeGenerator'
import { CouponModel } from '../coupon/coupon.model'
import { logger } from '@/logger'

export class CouponBookService {
  private couponBookModel = CouponBookModel
  private couponModel = CouponModel
  private database: Database
  private rabbitMQService: RabbitMQService

  constructor(routeServices: IRouteServices) {
    this.database = routeServices.database
    this.rabbitMQService = routeServices.rabbitMQService
  }

  async create(couponBookData: CreateCouponBookDTO): Promise<ICouponBookDocument> {
    logger.info('Creating coupon book')
    try {
      const couponBook = await this.couponBookModel.create(couponBookData)

      return couponBook
    } catch (err: any) {
      if (err.code === 11000) {
        const params = Object.keys(err.keyPattern)
        throw createError(409, params)
      }

      throw err
    }
  }

  async generateCouponsForBook(couponBookId: string, quantity: number) {
    logger.info('Generating coupons for book')
    const session = await this.database.startSession()

    try {
      const couponBook = await this.couponBookModel.findById(couponBookId)

      if (!couponBook) {
        throw createError(404, 'Coupon book not found')
      }

      if (!couponBook.isActive) {
        throw createError(403, 'Coupon book is not active')
      }

      const currentDate = new Date()
      if (new Date(couponBook.endDate) < currentDate) {
        throw createError(403, 'Coupon book has expired')
      }

      const maxSyncGenerator: number = config.get('couponBook.maxSyncGenerator')

      if (quantity > maxSyncGenerator) {
        await this.rabbitMQService.publishMessage(QUEUES.CODE_GENERATION, {
          couponBookId: couponBook._id,
          quantity,
          batchSize: config.get('couponBook.batchSize'),
        })

        return {
          couponBookId: couponBook._id,
          status: 'processing',
          message: `${quantity} code generation started in the background`,
        }
      }

      session.startTransaction()

      const couponsToCreate = []

      for (let i = 0; i < quantity; i++) {
        const code = generateRandomCode(couponBook.codePattern)

        couponsToCreate.push({
          couponBookId: couponBook._id,
          code,
          isAssigned: false,
          isRedeemed: false,
          redemptionCount: 0,
          lockedUntil: null,
        })
      }

      await this.couponModel.insertMany(couponsToCreate, { session })

      await this.couponBookModel.updateOne(
        { _id: couponBook._id },
        { $inc: { totalCodes: quantity } },
        { session },
      )

      await session.commitTransaction()

      return {
        couponBookId: couponBook._id,
        generatedCodes: quantity,
        totalCodes: couponBook.totalCodes + quantity,
        status: 'completed',
      }
    } catch (err) {
      await session.abortTransaction()
      throw err
    } finally {
      session.endSession()
    }
  }

  async uploadCouponsForBook(couponBookId: string, codes: string[]) {
    logger.info('Uploading coupons for book')
    const session = await this.database.startSession()

    try {
      const couponBook = await this.couponBookModel.findById(couponBookId)

      if (!couponBook) {
        throw createError(404, 'Coupon book not found')
      }

      session.startTransaction()

      const couponsToCreate = []

      for (const code of codes) {
        couponsToCreate.push({
          couponBookId,
          code,
          isAssigned: false,
          isRedeemed: false,
          redemptionCount: 0,
          lockedUntil: null,
        })
      }

      await this.couponModel.insertMany(couponsToCreate, { session })

      await this.couponBookModel.updateOne(
        { _id: couponBookId },
        { $inc: { totalCodes: codes.length } },
        { session },
      )

      await session.commitTransaction()

      return {
        couponBookId,
        uploadedCodes: codes.length,
        totalCodes: couponBook.totalCodes + codes.length,
        status: 'completed',
      }
    } catch (err) {
      await session.abortTransaction()
      throw err
    } finally {
      session.endSession()
    }
  }
}
