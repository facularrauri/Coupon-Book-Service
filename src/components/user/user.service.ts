import { CreateUserDTO } from './dto/create-user.dto'
import createError from 'http-errors'
import { UserModel, RoleModel, IUserDocument } from '../'

export class UserService {
  private userModel = UserModel
  private roleModel = RoleModel

  async create(userData: CreateUserDTO): Promise<IUserDocument> {
    try {
      const role = await this.roleModel.findOne({ name: 'user' })

      if (!role) {
        throw createError(404, 'Users cannot create accounts')
      }

      const user = await this.userModel.create({ ...userData, role: role._id })

      return user
    } catch (err: any) {
      if (err.code === 11000) {
        const params = Object.keys(err.keyPattern)
        throw createError(409, params)
      }

      throw err
    }
  }
}
