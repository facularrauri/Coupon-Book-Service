import { Request, Response, NextFunction } from 'express'
import { UserService } from './user.service'
import { CreateUserDTO } from './dto/create-user.dto'
import { validate } from 'class-validator'
import { ValidationError } from '@/errors'

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */
export class UserController {
  private userService: UserService

  constructor() {
    this.userService = new UserService()
  }

  /**
   * @swagger
   * /users:
   *   post:
   *     summary: Create a user
   *     tags: [Users]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateUserDTO'
   *     responses:
   *       201:
   *         description: User created successfully
   *       400:
   *         description: Bad request
   */
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { body } = req
      const userData = new CreateUserDTO()

      userData.firstName = body.firstName
      userData.lastName = body.lastName
      userData.password = body.password
      userData.email = body.email

      const validationErrors = await validate(userData)
      if (validationErrors.length > 0) {
        throw new ValidationError(validationErrors)
      }

      const user = await this.userService.create(userData)
      res.status(201).send(user)
    } catch (err) {
      next(err)
    }
  }
}
