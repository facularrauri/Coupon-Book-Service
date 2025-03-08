import { AuthController } from './auth.controller'
import { Router } from 'express'

class AuthRoute {
  public path = '/auth'
  public router = Router()
  private authController = new AuthController()

  constructor() {
    this.initializeRoutes()
  }

  private initializeRoutes() {
    this.router.post('/token', this.authController.login)
  }
}

export { AuthRoute }
