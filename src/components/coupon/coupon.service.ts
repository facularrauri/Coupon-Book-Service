import createError from 'http-errors'
import { IRouteServices } from 'interfaces'
import { Database } from '@/lib/database'
import { CouponModel } from './coupon.model'

import { UserCouponModel } from '../user-coupon/user-coupon.model'
import { CouponBookModel } from '../coupon-book/coupon-book.model'
import { TransactionModel } from '../transaction/transaction.model'
import { RedisClient } from '@/lib/redis'
import { logger } from '@/logger'

export class CouponService {
  private couponBookModel = CouponBookModel
  private couponModel = CouponModel
  private userCouponModel = UserCouponModel
  private transactionModel = TransactionModel
  private database: Database
  private redisClient: RedisClient

  constructor(routeServices: IRouteServices) {
    this.database = routeServices.database
    this.redisClient = routeServices.redisClient
  }

  async assignRandomCouponToUser(userId: string, couponBookId: string) {
    logger.info('Assigning random coupon to user')
    const session = await this.database.startSession()

    try {
      session.startTransaction()

      const userCouponsCount = await this.userCouponModel.countDocuments(
        {
          userId,
          couponBookId,
        },
        { session },
      )

      const couponBook = await this.couponBookModel.findById(couponBookId, {}, { session })

      if (!couponBook) {
        throw createError(404, 'Coupon book not found')
      }

      if (!couponBook.isActive) {
        throw createError(400, 'Cannot assign coupons from an inactive coupon book')
      }

      const currentDate = new Date()

      if (new Date(couponBook.endDate) < currentDate) {
        throw createError(410, 'Cannot assign coupons from an expired coupon book')
      }

      if (new Date(couponBook.startDate) > currentDate) {
        throw createError(403, 'The coupon book is not yet available for assignment')
      }

      if (couponBook.maxCodesPerUser && userCouponsCount >= couponBook.maxCodesPerUser) {
        throw createError(422, 'User has already reached the maximum allowed coupons')
      }

      const totalAvailableCoupons = await this.couponModel.countDocuments(
        {
          couponBookId,
          isAssigned: false,
        },
        { session },
      )

      if (totalAvailableCoupons === 0) {
        throw createError(404, 'No coupons available')
      }

      const randomSkip = Math.floor(Math.random() * totalAvailableCoupons)

      const coupon = await this.couponModel
        .find({ couponBookId, isAssigned: false })
        .sort({ _id: 1 })
        .skip(randomSkip)
        .limit(1)
        .session(session)

      if (!coupon.length) {
        throw createError(404, 'No unassigned coupons available')
      }

      const updatedCoupon = await this.couponModel.findByIdAndUpdate(
        coupon[0]._id,
        { isAssigned: true, updatedAt: new Date() },
        { new: true, session },
      )

      if (!updatedCoupon) {
        throw createError(409, 'Could not assign a coupon (concurrency issue)')
      }

      const userCoupon = await this.userCouponModel.create(
        [
          {
            userId,
            couponId: coupon[0]._id,
            couponBookId,
            code: coupon[0].code,
            assignedAt: new Date(),
            redemptions: [],
          },
        ],
        { session },
      )

      await this.transactionModel.create(
        [
          {
            userId,
            couponId: coupon[0]._id,
            couponBookId,
            code: coupon[0].code,
            action: 'assign',
            status: 'success',
            metadata: {},
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        { session },
      )

      await session.commitTransaction()

      return {
        userId,
        couponId: coupon[0]._id,
        couponBookId,
        code: coupon[0].code,
        assignedAt: userCoupon[0].assignedAt,
      }
    } catch (err) {
      await session.abortTransaction()
      throw err
    } finally {
      session.endSession()
    }
  }

  async assignSpecificCouponToUser(userId: string, code: string) {
    logger.info('Assigning coupon to user')
    const session = await this.database.startSession()

    try {
      session.startTransaction()

      const coupon = await this.couponModel.findOne({ code }).session(session)

      if (!coupon) {
        throw createError(404, 'Coupon book not found')
      }

      if (coupon.isAssigned) {
        throw createError(409, 'Coupon is already assigned')
      }

      const couponBook = await this.couponBookModel.findById(coupon.couponBookId).session(session)

      if (!couponBook) {
        throw createError(404, 'Coupon book not found')
      }

      if (!couponBook.isActive) {
        throw createError(400, 'Cannot assign coupons from an inactive coupon book')
      }

      const currentDate = new Date()
      if (new Date(couponBook.endDate) < currentDate) {
        throw createError(410, 'Cannot assign coupons from an expired coupon book')
      }

      if (new Date(couponBook.startDate) > currentDate) {
        throw createError(403, 'The coupon book is not yet available for assignment')
      }

      const userCouponsCount = await this.userCouponModel.countDocuments(
        {
          userId,
          couponBookId: coupon.couponBookId,
        },
        { session },
      )

      if (couponBook.maxCodesPerUser && userCouponsCount >= couponBook.maxCodesPerUser) {
        throw createError(422, 'User has already reached the maximum allowed coupons')
      }

      await this.couponModel.updateOne(
        { _id: coupon._id },
        { isAssigned: true, updatedAt: new Date() },
        { session },
      )

      const userCoupon = await this.userCouponModel.create(
        [
          {
            userId,
            couponId: coupon._id,
            couponBookId: coupon.couponBookId,
            code,
            assignedAt: new Date(),
            redemptions: [],
          },
        ],
        { session },
      )

      await this.transactionModel.create(
        [
          {
            userId,
            couponId: coupon._id,
            couponBookId: coupon.couponBookId,
            code,
            action: 'assign',
            status: 'success',
            metadata: {},
          },
        ],
        { session },
      )

      await session.commitTransaction()

      return {
        userId,
        couponId: coupon._id,
        couponBookId: coupon.couponBookId,
        code,
        assignedAt: userCoupon[0].assignedAt,
      }
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }

  async lockCouponForRedemption(code: string, userId: string, lockDurationSeconds: number) {
    logger.info('Locking coupon for redemption')
    const lockKey = `coupon:lock:${code}`

    try {
      const acquired = await this.redisClient.set(lockKey, userId, lockDurationSeconds)

      if (!acquired) {
        throw createError(409, 'The coupon is already locked by another process')
      }

      const userCoupon = await this.userCouponModel.findOne({ code, userId })

      if (!userCoupon) {
        await this.redisClient.del(lockKey)
        throw createError(404, 'Coupon not found for user')
      }

      const couponBook = await this.couponBookModel.findById(userCoupon.couponBookId)

      if (!couponBook) {
        await this.redisClient.del(lockKey)
        throw createError(404, 'Coupon book not found')
      }

      if (!couponBook.isActive) {
        await this.redisClient.del(lockKey)
        throw createError(400, 'Coupons from an inactive book cannot be redeemed')
      }

      const currentDate = new Date()
      if (new Date(couponBook.endDate) < currentDate) {
        await this.redisClient.del(lockKey)
        throw createError(400, 'Coupons from an expired book cannot be redeemed')
      }

      if (!couponBook.allowMultipleRedemptions && userCoupon.redemptions.length > 0) {
        await this.redisClient.del(lockKey)
        throw createError(400, 'The coupon has already been redeemed')
      }

      if (
        couponBook.maxRedemptionsPerUser &&
        userCoupon.redemptions.length >= couponBook.maxRedemptionsPerUser
      ) {
        await this.redisClient.del(lockKey)
        throw createError(400, 'The maximum redemptions for this coupon have been reached')
      }

      const lockedUntil = new Date(Date.now() + lockDurationSeconds * 1000)

      await this.couponModel.updateOne(
        { code },
        {
          lockedUntil,
          updatedAt: new Date(),
        },
      )

      const transaction = await this.transactionModel.create({
        userId,
        couponId: userCoupon.couponId,
        couponBookId: userCoupon.couponBookId,
        code,
        action: 'lock',
        status: 'success',
        metadata: { lockedUntil },
      })

      return {
        code,
        userId,
        lockedUntil,
        transactionId: transaction._id,
      }
    } catch (error) {
      await this.redisClient.del(lockKey)
      throw error
    }
  }

  async redeemCoupon(code: string, userId: string) {
    logger.info('Redeeming coupon')
    const session = await this.database.startSession()

    try {
      session.startTransaction()

      const userCoupon = await this.userCouponModel.findOne({ code, userId }).session(session)

      if (!userCoupon) {
        throw createError(404, 'Coupon not found for user')
      }

      const coupon = await this.couponModel.findById(userCoupon.couponId).session(session)

      if (!coupon) {
        throw createError(404, 'Coupon not found')
      }

      const couponBook = await this.couponBookModel
        .findById(userCoupon.couponBookId)
        .session(session)

      if (!couponBook) {
        throw createError(404, 'Coupon book not found')
      }

      if (!couponBook.isActive) {
        throw createError(400, 'Coupons from an inactive book cannot be redeemed')
      }

      const currentDate = new Date()
      if (new Date(couponBook.endDate) < currentDate) {
        throw createError(400, 'Coupons from an expired book cannot be redeemed')
      }

      if (coupon.lockedUntil && new Date(coupon.lockedUntil) > new Date()) {
        const lockKey = `coupon:lock:${code}`
        const lockOwner = await this.redisClient.get(lockKey)

        if (lockOwner !== userId) {
          throw createError(409, 'The coupon is already locked by another process')
        }
      } else {
        throw createError(403, 'The coupon has not been locked for redeem')
      }

      if (!couponBook.allowMultipleRedemptions && userCoupon.redemptions.length > 0) {
        throw createError(400, 'The coupon has already been redeemed')
      }

      if (
        couponBook.maxRedemptionsPerUser &&
        userCoupon.redemptions.length >= couponBook.maxRedemptionsPerUser
      ) {
        throw createError(400, 'The maximum redemptions for this coupon have been reached')
      }

      const transaction = await this.transactionModel.create(
        [
          {
            userId,
            couponId: userCoupon.couponId,
            couponBookId: userCoupon.couponBookId,
            code,
            action: 'redeem',
            status: 'success',
          },
        ],
        { session },
      )

      await this.couponModel.updateOne(
        { _id: userCoupon.couponId },
        {
          isRedeemed: true,
          redemptionCount: coupon.redemptionCount + 1,
          lockedUntil: null,
          updatedAt: new Date(),
        },
        { session },
      )

      const redemption = {
        redeemedAt: new Date(),
        transactionId: transaction[0]._id,
      }

      await this.userCouponModel.updateOne(
        { _id: userCoupon._id },
        {
          $push: { redemptions: redemption },
          updatedAt: new Date(),
        },
        { session },
      )

      const lockKey = `coupon:lock:${code}`
      await this.redisClient.del(lockKey)

      await session.commitTransaction()

      const remainingRedemptions = couponBook.maxRedemptionsPerUser
        ? couponBook.maxRedemptionsPerUser - (userCoupon.redemptions.length + 1)
        : couponBook.allowMultipleRedemptions
          ? Number.POSITIVE_INFINITY
          : 0

      return {
        code,
        userId,
        redeemedAt: redemption.redeemedAt,
        transactionId: transaction[0]._id,
        remainingRedemptions,
      }
    } catch (error) {
      await session.abortTransaction()
      throw error
    } finally {
      session.endSession()
    }
  }

  async getUserCoupons(userId: string) {
    const userCoupons = await this.userCouponModel
      .find({ userId })
      .populate('couponBookId', 'name description')
      .sort({ assignedAt: -1 })
      .lean()
      .exec()

    return userCoupons.map((uc) => ({
      couponId: uc.couponId,
      couponBookId: uc.couponBookId._id,
      code: uc.code,
      bookName: (uc.couponBookId as any).name,
      assignedAt: uc.assignedAt,
      isRedeemed: uc.redemptions.length > 0,
      redemptions: uc.redemptions,
    }))
  }
}
