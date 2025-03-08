import { Request, Response, NextFunction } from 'express'
import { CouponService } from './coupon.service'
import { IRouteServices } from 'interfaces'
import { LockCouponDTO } from './dto/lock-coupon.dto'
import { validate } from 'class-validator'
import { ValidationError } from '@/errors'
import config from 'config'
import { AssignCouponDTO } from './dto/assign-coupon.dto'
import { AssignRandomCouponDTO } from './dto/assign-random-coupon.dto'

/**
 * @swagger
 * tags:
 *   name: Coupons
 *   description: Coupons management endpoints
 */
export class CouponController {
  private couponService: CouponService

  constructor(routeServices: IRouteServices) {
    this.couponService = new CouponService(routeServices)
  }

  /**
   * @swagger
   * /coupons/assign:
   *   post:
   *     summary: Assign random coupon to user
   *     tags: [Coupons]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/AssignRandomCouponDTO'
   *     responses:
   *       201:
   *         description: Coupon assigned successfully
   *       400:
   *         description: Bad request
   */
  assignRandom = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const assingRandomCouponData = new AssignRandomCouponDTO()
      const { userId, couponBookId } = req.body

      assingRandomCouponData.couponBookId = couponBookId
      assingRandomCouponData.userId = userId

      const validationErrors = await validate(assingRandomCouponData)
      if (validationErrors.length > 0) {
        throw new ValidationError(validationErrors)
      }
      const result = await this.couponService.assignRandomCouponToUser(userId, couponBookId)
      res.status(201).send(result)
    } catch (err) {
      next(err)
    }
  }

  /**
   * @swagger
   * /coupons/assign/{code}:
   *   post:
   *     summary: Assign coupon to user
   *     tags: [Coupons]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *         description: Coupon code
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/AssignCouponDTO'
   *     responses:
   *       201:
   *         description: Coupon assigned successfully
   *       400:
   *         description: Bad request
   */
  assign = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const assingCouponData = new AssignCouponDTO()
      const { userId } = req.body
      const { code } = req.params

      assingCouponData.userId = userId

      const validationErrors = await validate(assingCouponData)
      if (validationErrors.length > 0) {
        throw new ValidationError(validationErrors)
      }
      const result = await this.couponService.assignSpecificCouponToUser(userId, code)
      res.status(201).send(result)
    } catch (err) {
      next(err)
    }
  }

  /**
   * @swagger
   * /coupons/lock/{code}:
   *   post:
   *     summary: Lock a coupon for redemption
   *     tags: [Coupons]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *         description: Coupon code
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LockCouponDTO'
   *     responses:
   *       201:
   *         description: Coupon locked successfully
   *       400:
   *         description: Bad request
   */
  lock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const lockCouponData = new LockCouponDTO()
      const { userId } = req.body
      const { code } = req.params

      lockCouponData.userId = userId

      const validationErrors = await validate(lockCouponData)
      if (validationErrors.length > 0) {
        throw new ValidationError(validationErrors)
      }

      const result = await this.couponService.lockCouponForRedemption(
        code,
        userId,
        config.get('coupon.lockDurationSeconds'),
      )
      res.status(201).send(result)
    } catch (err) {
      next(err)
    }
  }

  /**
   * @swagger
   * /coupons/redeem/{code}:
   *   post:
   *     summary: redeem a coupon
   *     tags: [Coupons]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *         description: Coupon code
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/AssignCouponDTO'
   *     responses:
   *       201:
   *         description: Coupon locked successfully
   *       400:
   *         description: Bad request
   */
  redeem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const redeemCouponData = new AssignCouponDTO()
      const { userId } = req.body
      const { code } = req.params

      redeemCouponData.userId = userId

      const validationErrors = await validate(redeemCouponData)
      if (validationErrors.length > 0) {
        throw new ValidationError(validationErrors)
      }

      const result = await this.couponService.redeemCoupon(code, userId)
      res.status(201).send(result)
    } catch (err) {
      next(err)
    }
  }

  /**
   * @swagger
   * /coupons/user/{id}:
   *   get:
   *     summary: Return coupons assigned to user
   *     tags: [Coupons]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: User id
   *     responses:
   *       201:
   *         description: Coupon locked successfully
   *       400:
   *         description: Bad request
   */
  queryUserCoupons = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.couponService.getUserCoupons(req.params.id)
      res.status(201).send(result)
    } catch (err) {
      next(err)
    }
  }
}
