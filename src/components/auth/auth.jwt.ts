import jwt from 'jsonwebtoken'
import createError from 'http-errors'
import { IUserDocument } from '../index'
import config from 'config'
import { logger } from '../../logger'

export class Jwt {
  private config = config
  private logger = logger

  async createToken(user: IUserDocument) {
    try {
      const privateKey: string = this.config.get('auth.token.secret')

      if (!privateKey) throw Error('cannot get key to create token')

      const payload: any = {
        id: user._id,
        role: user.role.name,
        permissions: user.role.permissions,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      }

      const token = jwt.sign(payload, privateKey, {
        subject: user._id.toString(),
        issuer: this.config.get('auth.token.issuer'),
        algorithm: this.config.get('auth.token.algorithm'),
        audience: user.role.audience,
        expiresIn: this.config.get('auth.token.expiresIn'),
      })

      const refreshToken = await user.generateRefreshToken()

      return { token, refreshToken }
    } catch (err) {
      this.logger.error('Error creating JWT', err)
      throw err
    }
  }

  static getToken(_token: string) {
    const TOKEN_REGEX = /^\s*Bearer\s+(\S+)/g
    const matches = TOKEN_REGEX.exec(_token)
    if (!matches) {
      throw createError.Unauthorized()
    }
    const [, token] = matches
    return token
  }
}
