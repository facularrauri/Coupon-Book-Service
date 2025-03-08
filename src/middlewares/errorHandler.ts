import { Response, NextFunction } from 'express'
// import { UniqueConstraintError } from 'sequelize'
import { translateError } from '../utils/translateError'
import { HttpError } from 'http-errors'
import { ValidationError } from '../errors'
// import config from 'config'
import { IRequest } from '../interfaces/request.interface'

export function errorHandler(err: Error, req: IRequest, res: Response, next: NextFunction) {
  // if (err instanceof UniqueConstraintError) {
  //   const message = translateError(err.errors.map((e: any) => e.message).join(', '))
  //   req.logger.error(`${err.toString()}: ${message}`)
  //   return res.status(409).json({ error: 'Conflict', message })
  // }

  if (err instanceof HttpError) {
    req.logger.error(`${err.toString()}: ${err.message}`)
    return res.status(err.statusCode).json({ message: err.message })
  }

  if (err instanceof ValidationError) {
    const translatedErrorMessages = []

    for (const validationError of err.validationErrors) {
      for (const constraintKey in validationError.constraints) {
        if (Object.prototype.hasOwnProperty.call(validationError.constraints, constraintKey)) {
          const originalErrorMessage = validationError.constraints[constraintKey]
          const translatedErrorMessage = translateError(originalErrorMessage)
          translatedErrorMessages.push(translatedErrorMessage || originalErrorMessage)
        }
      }
    }
    const errorMessage = translatedErrorMessages.join('. ')
    req.logger.error(`${err.toString()}: ${errorMessage}`)
    return res.status(400).json({ error: 'Bad Request', message: errorMessage })
  }

  req.logger.error(`${err.toString()}: ${err.message}`)
  res.status(500).send({ error: 'Internal Server Error', message: err.message })
  next()
}
