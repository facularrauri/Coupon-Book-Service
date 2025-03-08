import { model, Schema, Types } from 'mongoose'
import MongooseDelete, { SoftDeleteModel, SoftDeleteDocument } from 'mongoose-delete'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import config from 'config'
import { promisify } from 'util'
import { IRole } from '../role/role.model'

// @ts-expect-error no-types
import validate from 'mongoose-validator'
import cryptoRandomString from 'crypto-random-string'

export interface IUser {
  _id: Types.ObjectId
  password: string
  firstName: string
  lastName: string
  email: string
  role: Types.ObjectId & IRole
  verificationToken?: string
  passwordResetToken?: string
  refreshToken?: string
  passwordSetAt: Date
  passwordExpiresAt: Date
  previousPasswords: string[]
  failedPasswordCheckCount: number

  passwordLastCheckedAt?: Date
  verificationTokenSetAt?: Date
  passwordResetTokenSetAt?: Date
  refreshTokenSetAt?: Date
  verifiedAt?: Date | undefined
  lockedAt?: Date | undefined
  lastActivityAt?: Date

  createdAt: Date
  updatedAt: Date
  createdBy?: Schema.Types.ObjectId
  updatedBy?: Schema.Types.ObjectId
  removedAt?: Date
  restoredAt?: Date

  isLocked?: boolean
  isVerified?: boolean
}

interface IUserMethods {
  checkPassword(
    potentialPassword: string,
    passwordTtl: number,
  ): Promise<{ isOk: boolean; isLocked?: boolean; isExpired?: boolean }>
  generateRefreshToken(): Promise<string>
  generateVerificationToken(): Promise<string>
  generatePasswordResetToken(): Promise<string>
}

export interface IUserDocument extends IUser, SoftDeleteDocument, IUserMethods {
  _id: Types.ObjectId
}

interface UserModel extends SoftDeleteModel<IUserDocument> {
  applyPasswordResetWithToken(
    rawPasswordResetToken: string,
    newPassword: string,
    tokenTtl: number,
  ): Promise<{ isOk: boolean; isLocked?: boolean; isExpired?: boolean; user?: IUserDocument }>

  applyPasswordVerifyToken(
    rawPasswordResetToken: string,
    tokenTtl: number,
  ): Promise<{ isOk: boolean; isLocked?: boolean; isExpired?: boolean; user?: IUserDocument }>

  verifyWithToken(
    rawVerificationToken: string,
    tokenTtl: number,
  ): Promise<{ isOk: boolean; isExpired?: boolean; user?: IUserDocument }>

  verifyRefreshToken(
    rawRefreshToken: string,
  ): Promise<{ isOk: boolean; isExpired?: boolean; user?: IUserDocument }>
}

const emailValidator = validate({ validator: 'isEmail' })

const userSchema = new Schema<IUserDocument>(
  {
    password: { type: String, select: false },
    firstName: { type: String, lowercase: true, trim: true },
    lastName: { type: String, lowercase: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: emailValidator,
    },
    role: { type: Schema.Types.ObjectId, ref: 'Role' },
    verificationToken: { type: String, unique: true, sparse: true, select: false },
    passwordResetToken: { type: String, unique: true, sparse: true, select: false },
    refreshToken: { type: String, unique: true, sparse: true, select: false },
    passwordSetAt: { type: Date },
    passwordExpiresAt: { type: Date, select: false },
    previousPasswords: [{ type: String, select: false }],
    failedPasswordCheckCount: { type: Number, default: 0 },

    passwordLastCheckedAt: { type: Date, select: false },
    verificationTokenSetAt: { type: Date, select: false },
    passwordResetTokenSetAt: { type: Date, select: false },
    refreshTokenSetAt: { type: Date, select: false },
    verifiedAt: { type: Date },
    lockedAt: { type: Date },
    lastActivityAt: { type: Date },

    createdAt: { type: Date },
    updatedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date },
    restoredAt: { type: Date },
  },
  { timestamps: true },
)

userSchema.plugin(MongooseDelete, { deletedAt: true, deletedBy: true, overrideMethods: true })

userSchema.virtual('hasPassword').get(function get() {
  return this.password !== undefined && this.password !== null
})

userSchema
  .virtual('isLocked')
  .get(function get() {
    return this.lockedAt !== undefined && this.lockedAt !== null
  })
  .set(function set(val) {
    this.lockedAt = val ? new Date() : undefined
  })

userSchema
  .virtual('isVerified')
  .get(function get() {
    return this.verifiedAt !== undefined && this.verifiedAt !== null
  })
  .set(function set(val) {
    this.verifiedAt = val ? new Date() : undefined
  })

userSchema.pre('validate', async function preValidate(next) {
  if (!this.password || !this.isModified('password')) {
    return next(null)
  }

  if (this.password.length < 8) {
    this.invalidate('password', 'Password must be longer than eight characters', undefined, 'short')
    return next(null)
  }

  if (!/[A-Za-z]/.test(this.password)) {
    this.invalidate(
      'password',
      'Password must contain at least one letter',
      undefined,
      'missingLetter',
    )
    return next(null)
  }

  if (!/[0-9]/.test(this.password)) {
    this.invalidate(
      'password',
      'Password must contain at least one number',
      undefined,
      'missingNumber',
    )
    return next(null)
  }

  try {
    for (const previousPassword of this.previousPasswords) {
      const isEqual = await bcrypt.compare(this.password, previousPassword)
      if (isEqual) {
        this.invalidate('password', 'Password already used', undefined, 'usedBefore')
        return next(null)
      }
    }

    const hashedPassword = await bcrypt.hash(this.password, 10)
    const passwordTtl: number = config.get('auth.passwordTtl')
    this.passwordSetAt = new Date()
    this.passwordExpiresAt = new Date(Date.now() + passwordTtl)
    this.password = hashedPassword

    if (!this.previousPasswords) {
      this.previousPasswords = []
    }

    this.previousPasswords.unshift(this.password)
    if (this.previousPasswords.length > 4) {
      this.previousPasswords.length = 4
    }

    next(null)
  } catch (error: any) {
    next(error)
  }
})

userSchema.method('checkPassword', async function checkPassword(potentialPassword, passwordTtl) {
  if (!potentialPassword) {
    return Promise.reject(new Error('Password is required'))
  }

  this.passwordLastCheckedAt = new Date()
  if (!this.password) {
    await this.save()
    return { isOk: false }
  }

  const isMatch = await bcrypt.compare(potentialPassword, this.password)

  if (isMatch) {
    this.failedPasswordCheckCount = 0
  } else {
    if (!this.failedPasswordCheckCount) {
      this.failedPasswordCheckCount = 0
    }
    this.failedPasswordCheckCount += 1
    if (this.failedPasswordCheckCount >= 6) {
      this.isLocked = true
    }
  }

  let isExpired = false
  if (this.passwordSetAt && passwordTtl) {
    const passwordSetAt = this.passwordSetAt.getTime()
    const passwordExpiresAt = passwordSetAt + passwordTtl

    isExpired = passwordExpiresAt < Date.now()
  }

  await this.save()
  return { isOk: isMatch, isLocked: this.isLocked, isExpired }
})

userSchema.static(
  'applyPasswordResetWithToken',
  async function applyPasswordResetWithToken(rawPasswordResetToken, newPassword, tokenTtl) {
    const hash = crypto.createHash('sha256')
    hash.update(rawPasswordResetToken)
    const passwordResetToken = hash.digest('hex')

    const user = await this.findOne({ passwordResetToken }, '+previousPasswords')

    if (!user) {
      return { isOk: false }
    }
    if (user.isLocked) {
      return { isOk: false, isLocked: true }
    }

    if (user.passwordResetTokenSetAt && tokenTtl) {
      const passwordResetTokenSetAt = user.passwordResetTokenSetAt.getTime()
      const passwordResetTokenExpiresAt = passwordResetTokenSetAt + tokenTtl

      if (passwordResetTokenExpiresAt < Date.now()) {
        user.passwordResetTokenSetAt = undefined
        user.passwordResetToken = undefined

        await user.save()
        return { isOk: false, isExpired: true }
      }
    }

    user.password = newPassword
    user.passwordResetToken = undefined
    user.failedPasswordCheckCount = 0

    await user.save()
    return { isOk: true, user }
  },
)

userSchema.static(
  'verifyWithToken',
  async function verifyWithToken(rawVerificationToken, tokenTtl) {
    const hash = crypto.createHash('sha256')
    hash.update(rawVerificationToken)
    const verificationToken = hash.digest('hex')

    const user = await this.findOne({ verificationToken })

    if (!user) {
      return { isOk: false }
    }

    if (user.verificationTokenSetAt && tokenTtl) {
      const verificationTokenSetAt = user.verificationTokenSetAt.getTime()
      const verificationTokenExpiresAt = verificationTokenSetAt + tokenTtl

      if (verificationTokenExpiresAt < Date.now()) {
        user.verificationTokenSetAt = undefined
        user.verificationToken = undefined

        await user.save()
        return { isOk: false, isExpired: true }
      }
    }

    user.isVerified = true
    user.verificationTokenSetAt = undefined
    user.verificationToken = undefined

    await user.save()
    return { isOk: true, user }
  },
)

userSchema.static(
  'applyPasswordVerifyToken',
  async function applyPasswordVerifyToken(rawPasswordResetToken, tokenTtl) {
    const hash = crypto.createHash('sha256')
    hash.update(rawPasswordResetToken)
    const passwordResetToken = hash.digest('hex')

    const user = await this.findOne({ passwordResetToken }, '+previousPasswords')

    if (!user) {
      return { isOk: false }
    }

    if (user.isLocked) {
      return { isOk: false, isLocked: true }
    }

    if (user.passwordResetTokenSetAt && tokenTtl) {
      const passwordResetTokenSetAt = user.passwordResetTokenSetAt.getTime()
      const passwordResetTokenExpiresAt = passwordResetTokenSetAt + tokenTtl

      if (passwordResetTokenExpiresAt < Date.now()) {
        user.passwordResetTokenSetAt = undefined
        user.passwordResetToken = undefined

        await user.save()
        return { isOk: false, isExpired: true }
      }
    }

    return { isOk: true, user }
  },
)

userSchema.static('verifyRefreshToken', async function verifyRefreshToken(rawRefreshToken) {
  if (!rawRefreshToken) {
    return Promise.reject(new Error('refreshTokenTtl is required'))
  }

  const hash = crypto.createHash('sha256')
  hash.update(rawRefreshToken)
  const refreshToken = hash.digest('hex')

  const user = await this.findOne({ refreshToken }, '+refreshTokenSetAt').populate('role')

  if (!user) {
    return { isOk: false }
  }

  if (user.refreshTokenSetAt) {
    const refreshTokenTtl: number = config.get('auth.refreshTokenTtl')

    const refreshTokenSetAt = user.refreshTokenSetAt.getTime()
    const refreshTokenExpiresAt = refreshTokenSetAt + refreshTokenTtl

    user.refreshTokenSetAt = undefined
    user.refreshToken = undefined

    await user.save()

    if (refreshTokenExpiresAt < Date.now()) {
      return { isOk: false, isExpired: true }
    } else {
      return { isOk: true, user }
    }
  } else {
    return { isOk: false }
  }
})

userSchema.method('generateRefreshToken', async function generateRefreshToken() {
  const generateRandomBytesAsync = promisify(crypto.randomBytes)

  const randomBytes = await generateRandomBytesAsync(40)
  const rawRefreshToken = randomBytes.toString('hex')

  const hash = crypto.createHash('sha256')
  hash.update(rawRefreshToken)

  this.refreshTokenSetAt = new Date()
  this.refreshToken = hash.digest('hex')

  await this.save()
  return rawRefreshToken
})

userSchema.method('generateVerificationToken', async function generateVerificationToken() {
  const rawVerificationToken = cryptoRandomString({ length: 4, type: 'numeric' })
  const hash = crypto.createHash('sha256')
  hash.update(rawVerificationToken)

  this.verificationTokenSetAt = new Date()
  this.verificationToken = hash.digest('hex')

  await this.save()
  return rawVerificationToken
})

userSchema.method('generatePasswordResetToken', async function generatePasswordResetToken() {
  const rawPasswordResetToken = cryptoRandomString({ length: 4, type: 'numeric' })

  const hash = crypto.createHash('sha256')
  hash.update(rawPasswordResetToken)

  this.passwordResetTokenSetAt = new Date()
  this.passwordResetToken = hash.digest('hex')

  await this.save()
  return rawPasswordResetToken
})

userSchema.statics.updateLastActivityAt = async function updateLastActivityAt(id) {
  await this.collection.updateOne(
    { _id: new Schema.ObjectId(id) },
    { $max: { lastActivityAt: new Date() } },
  )
}

export const UserModel = model<IUserDocument, UserModel>('User', userSchema)
