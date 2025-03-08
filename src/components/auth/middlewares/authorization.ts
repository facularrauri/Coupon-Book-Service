import { Request, Response, NextFunction } from 'express'
import { IRequest } from 'interfaces'

export function authorize(requiredPermission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const _req = req as IRequest
    try {
      const hasPermission = _req.user.permissions.includes(requiredPermission)

      if (!hasPermission) {
        return res.status(403).end()
      }

      next()
    } catch (err) {
      return res.status(500).send(err)
    }
  }
}

export function ownerShip(req: Request, res: Response, next: NextFunction) {
  const _req = req as IRequest
  try {
    if (_req.user.sub !== req.params.id) {
      return res.status(403).end()
    }

    next()
  } catch (err) {
    return res.status(500).send(err)
  }
}
