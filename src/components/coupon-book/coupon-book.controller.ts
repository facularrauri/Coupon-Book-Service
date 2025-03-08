import { Request, Response, NextFunction } from 'express'
import { CouponBookService } from './coupon-book.service'
import { IRouteServices } from 'interfaces'
import { CreateCouponBookDTO } from './dto/create-coupon-book.dto'
import { validate } from 'class-validator'
import { ValidationError } from '@/errors'
import { GenerateCodesDTO } from './dto/generate-codes.dto'
import { UploadCouponsDTO } from './dto/upload-coupons.dto'

/**
 * @swagger
 * tags:
 *   name: Coupon Book
 *   description: Coupon Book management endpoints
 */
export class CouponBookController {
  private couponBookService: CouponBookService

  constructor(routeServices: IRouteServices) {
    this.couponBookService = new CouponBookService(routeServices)
  }

  /**
   * @swagger
   * /coupons:
   *   post:
   *     summary: Create a Coupon Book
   *     tags: [Coupon Book]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateCouponBookDTO'
   *     responses:
   *       201:
   *         description: Coupon Book created successfully
   *       400:
   *         description: Bad request
   */
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { body } = req
      const couponBookData = new CreateCouponBookDTO()

      couponBookData.name = body.name
      couponBookData.allowMultipleRedemptions = body.allowMultipleRedemptions
      couponBookData.codePattern = body.codePattern
      couponBookData.description = body.description
      couponBookData.endDate = body.endDate
      couponBookData.startDate = body.startDate
      couponBookData.isActive = body.isActive
      couponBookData.maxCodesPerUsers = body.maxCodesPerUsers
      couponBookData.maxRedemptionsPerUser = body.maxRedemptionsPerUser

      const validationErrors = await validate(couponBookData)
      if (validationErrors.length > 0) {
        throw new ValidationError(validationErrors)
      }

      const couponBook = await this.couponBookService.create(couponBookData)
      res.status(201).send(couponBook)
    } catch (err) {
      next(err)
    }
  }

  /**
   * @swagger
   * /coupons/random-codes:
   *  post:
   *     summary: Generate coupons for book
   *     tags: [Coupon Book]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/GenerateCodesDTO'
   *     responses:
   *       201:
   *         description: Coupon Book created successfully
   *       400:
   *         description: Bad request
   */
  generateCodes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const generateCodesData = new GenerateCodesDTO()
      const { quantity, couponBookId } = req.body

      generateCodesData.quantity = quantity
      generateCodesData.couponBookId = couponBookId

      const validationErrors = await validate(generateCodesData)
      if (validationErrors.length > 0) {
        throw new ValidationError(validationErrors)
      }
      const result = await this.couponBookService.generateCouponsForBook(
        generateCodesData.couponBookId,
        generateCodesData.quantity,
      )

      res.status(201).send(result)
    } catch (error) {
      next(error)
    }
  }

  /**
   * @swagger
   * /coupons/codes:
   *  post:
   *     summary: Upload coupons for book
   *     tags: [Coupon Book]
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UploadCouponsDTO'
   *     responses:
   *       201:
   *         description: Coupons upload successfully
   *       400:
   *         description: Bad request
   */
  uploadCodes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { codes, couponBookId } = req.body

      const codesData = new UploadCouponsDTO()

      codesData.codes = codes
      codesData.couponBookId = couponBookId

      const validationErrors = await validate(codesData)
      if (validationErrors.length > 0) {
        throw new ValidationError(validationErrors)
      }

      const result = await this.couponBookService.uploadCouponsForBook(
        couponBookId,
        codesData.codes,
      )

      res.status(201).send(result)
    } catch (error) {
      next(error)
    }
  }
}
