import { Request } from 'express'
import { Logger } from 'winston'

export interface JwtPayload {
  role: string
  permissions: string[]
  iat: number
  exp: number
  aud: string[]
  iss: string
  sub: string
}

export interface IRequest extends Request {
  user: JwtPayload
  logger: Logger
  _startTime: number
  id: string
  offset?: number
  limit?: number
  sort?: string
  select?: string | string[]
  populate?: string | string[]
}
