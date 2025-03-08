import { Request, Response, NextFunction } from 'express'
import { AuthService } from './auth.service'
import { IRequest } from 'interfaces'

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */
export class AuthController {
  private authService = new AuthService()

  /**
   * @swagger
   * /auth/token:
   *   post:
   *     summary: Login user and get JWT token
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginDTO'
   *     responses:
   *       200:
   *         description: Successful login
   *       401:
   *         description: Invalid credentials
   *       404:
   *         description: User not found
   */
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, refreshToken } = await this.authService.login(req as IRequest)
      res.status(200).send({ token, refreshToken })
    } catch (err) {
      next(err)
    }
  }
}
