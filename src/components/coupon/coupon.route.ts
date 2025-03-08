import { Router } from 'express'
import { IRoute, IRouteServices, COUPON_BOOK_PERMISSIONS, COUPON_PERMISSIONS } from 'interfaces'
import { CouponController } from './coupon.controller'
import { CouponBookController } from '../coupon-book/coupon-book.controller'
import { authentication, authorize, ownerShip } from '..'

export class CouponRoute implements IRoute {
  public path = '/coupons'
  public router = Router()
  private couponController: CouponController
  private couponBookController: CouponBookController

  constructor(routeServices: IRouteServices) {
    this.couponController = new CouponController(routeServices)
    this.couponBookController = new CouponBookController(routeServices)
    this.initializeRoutes()
  }

  private initializeRoutes() {
    this.router.get(
      '/user/:id',
      authentication,
      authorize(COUPON_PERMISSIONS.READ),
      ownerShip,
      this.couponController.queryUserCoupons,
    )
    this.router.post(
      '/',
      authentication,
      authorize(COUPON_BOOK_PERMISSIONS.CREATE),
      this.couponBookController.create,
    )
    this.router.post(
      '/codes',
      authentication,
      authorize(COUPON_BOOK_PERMISSIONS.UPLOAD_CODES),
      this.couponBookController.uploadCodes,
    )
    this.router.post(
      '/random-codes',
      authentication,
      authorize(COUPON_BOOK_PERMISSIONS.GENERATE_CODES),
      this.couponBookController.generateCodes,
    )
    this.router.post(
      '/assign',
      authentication,
      authorize(COUPON_PERMISSIONS.ASSIGN_SPECIFIC),
      this.couponController.assignRandom,
    )
    this.router.post(
      '/assign/:code',
      authentication,
      authorize(COUPON_PERMISSIONS.ASSIGN),
      this.couponController.assign,
    )
    this.router.post(
      '/lock/:code',
      authentication,
      authorize(COUPON_PERMISSIONS.LOCK),
      this.couponController.lock,
    )
    this.router.post(
      '/redeem/:code',
      authentication,
      authorize(COUPON_PERMISSIONS.REDEEM),
      this.couponController.redeem,
    )
  }
}
