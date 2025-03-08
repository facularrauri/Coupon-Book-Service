import { Router } from 'express'
import { IRoute } from 'interfaces'
import { UserController } from './user.controller'

export class UserRoute implements IRoute {
  public path = '/users'
  public router = Router()
  private userController: UserController

  constructor() {
    this.userController = new UserController()

    this.initializeRoutes()
  }

  private initializeRoutes() {
    this.router.post('/', this.userController.create)
  }
}
