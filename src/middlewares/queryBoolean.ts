import { Request, Response, NextFunction } from 'express'

function parseBoolFromString(string: string): boolean | string {
  if (string === 'true') {
    return true
  } else if (string === 'false') {
    return false
  } else {
    return string
  }
}

function parseValue(value: any): any {
  if (typeof value === 'string') {
    return parseBoolFromString(value)
  } else if (value.constructor === Object) {
    return parseObject(value)
  } else if (Array.isArray(value)) {
    const array: any[] = []
    value.forEach((item: any, itemKey: number) => {
      array[itemKey] = parseValue(item)
    })
    return array
  } else {
    return value
  }
}

function parseObject(obj: { [key: string]: any }): { [key: string]: any } {
  const result: { [key: string]: any } = {}
  let key: string
  let value: any

  for (key in obj) {
    // eslint-disable-next-line no-prototype-builtins
    if (obj.hasOwnProperty(key)) {
      value = obj[key]
      result[key] = parseValue(value)
    }
  }

  return result
}

export function boolParser() {
  return function (req: Request, _: Response, next: NextFunction) {
    req.query = parseObject(req.query)
    next()
  }
}
