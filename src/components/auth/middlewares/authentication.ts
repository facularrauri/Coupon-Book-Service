import jwt from 'jsonwebtoken'
import createError from 'http-errors'
import config from 'config'
import { IRequest, JwtPayload } from 'interfaces'
import { Request, Response, NextFunction } from 'express'
import { Jwt } from '../auth.jwt'
import { logger } from '../../../logger'

function authenticationMiddleware(_req: Request, res: Response | null, next: NextFunction) {
  const req = _req as IRequest
  if (!req.headers.authorization) {
    logger.warn('Missing authorization header')
    return next(createError(401, 'Falta el encabezado de autorización'))
  }

  try {
    const token = Jwt.getToken(req.headers.authorization)

    req.user = jwt.verify(token, 'secret', {
      audience: config.get('auth.token.audience'),
      algorithms: [config.get('auth.token.algorithm')],
      issuer: config.get('auth.token.issuer'),
    }) as JwtPayload

    if (!req.user || !req.user.role || !req.user.permissions) {
      logger.error('Error authenticating JWT: missing payload information')
      return next(new createError.Unauthorized())
    }

    logger.verbose(`User ${req.user.sub} authenticated`)
    return next(null)
  } catch (err: any) {
    if (err.message === 'invalid algorithm' || err.message === 'invalid signature') {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress
      logger.error(`Suspicious access attempt from ip=${ip} ${req.headers.authorization}`)
    }
    logger.error('Authentication Middleware error', err)
    return next(new createError.Unauthorized(err.message || err))
  }
}

export { authenticationMiddleware as authentication }
