export enum COUPON_BOOK_PERMISSIONS {
  CREATE = 'coupon-book:create',
  READ = 'coupon-book:read',
  UPDATE = 'coupon-book:update',
  DELETE = 'coupon-book:delete',
  GENERATE_CODES = 'coupon-book:generate-codes',
  UPLOAD_CODES = 'coupon-book:upload-codes',
}

export enum COUPON_PERMISSIONS {
  ASSIGN = 'coupon:assign',
  ASSIGN_SPECIFIC = 'coupon:assign-specific',
  LOCK = 'coupon:lock',
  REDEEM = 'coupon:redeem',
  READ = 'coupon:read',
}

export const ALL_PERMISSIONS = [
  ...Object.values(COUPON_BOOK_PERMISSIONS),
  ...Object.values(COUPON_PERMISSIONS),
]

export const ROLE_DEFINITIONS = {
  ADMIN: ALL_PERMISSIONS,
  USER: [COUPON_PERMISSIONS.READ],
}
