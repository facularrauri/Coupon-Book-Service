import { v4 as uuidv4 } from 'uuid'
import { Response, NextFunction } from 'express'

function generateV4UUID(): string {
  return uuidv4()
}

const ATTRIBUTE_NAME = 'id'

export function requestID({
  generator = generateV4UUID,
  headerName = 'X-Request-Id',
  setHeader = true,
} = {}) {
  return function (request: any, response: Response, next: NextFunction) {
    const oldValue = request.get(headerName)
    const id = oldValue === undefined ? generator() : oldValue

    if (setHeader) {
      response.set(headerName, id)
    }

    request[ATTRIBUTE_NAME] = id

    next()
  }
}
