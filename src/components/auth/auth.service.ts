import { UserModel } from '../user/user.model'
import { IRequest } from 'interfaces'
import { LoginDTO } from './dto/login-dto'
import { validate } from 'class-validator'
import { Jwt } from './auth.jwt'
import createError from 'http-errors'
import config from 'config'
import { ValidationError } from '@/errors'

export class AuthService {
  private userModel = UserModel
  private jwt = new Jwt()

  async login(req: IRequest) {
    try {
      req.logger.info(`Creating user token for ${req.body.email}`)

      const { body } = req

      const loginData = new LoginDTO()

      loginData.email = body.email
      loginData.password = body.password

      const validationErrors = await validate(loginData)

      if (validationErrors.length > 0) {
        throw new ValidationError(validationErrors)
      }

      const user = await this.userModel
        .findOne(
          {
            email: loginData.email,
          },
          '+password',
        )
        .populate('role')

      if (!user) {
        req.logger.verbose('User not found. Sending 404 to client')
        throw createError(404, 'El usuario no existe')
      }

      if (!user.password) {
        req.logger.verbose('User does not have password. Sending 400 to client')
        throw createError(400, 'La cuenta fue registrada con Google o Facebook')
      }

      req.logger.verbose('Checking user password')

      const passwordTtl: number = config.get('auth.passwordTtl')

      const result = await user.checkPassword(req.body.password, passwordTtl)

      if (result.isLocked) {
        req.logger.verbose('User is locked. Sending 423 (Locked) to client')
        throw createError(423, 'El usuario está bloqueado')
      }

      if (!result.isOk) {
        req.logger.verbose('User password is invalid. Sending 401 to client')
        throw createError(401, 'La contraseña es incorrecta')
      }

      if (result.isExpired) {
        req.logger.verbose('User password has expired. Sending 403 to client')
        throw createError(403, 'La contraseña ha expirado')
      }

      const { token, refreshToken } = await this.jwt.createToken(user)
      return { token, refreshToken }
    } catch (err) {
      throw err
    }
  }
}
