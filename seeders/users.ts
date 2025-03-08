import { ObjectId } from 'mongodb'
import { IUser } from '../src/components'

const admin: IUser = {
  _id: new ObjectId('000000000000000000000000'),
  passwordExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 1000),
  passwordSetAt: new Date(),
  email: 'admin@admin.com',
  password: '$2a$10$J3Qa3YiZTxXBX7NsSXMWmeVfrnsK7GXyCQM8sQ0VpSgvULxA/DOgO', // Password1
  firstName: 'darth',
  lastName: 'vader',
  role: new ObjectId('000000000000000000000000') as any,
  failedPasswordCheckCount: 0,
  previousPasswords: [],
  verifiedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
}

const user: IUser = {
  _id: new ObjectId('000000000000000000000001'),
  passwordExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 1000),
  passwordSetAt: new Date(),
  email: 'user@user.com',
  password: '$2a$10$J3Qa3YiZTxXBX7NsSXMWmeVfrnsK7GXyCQM8sQ0VpSgvULxA/DOgO', // Password1
  firstName: 'han',
  lastName: 'solo',
  role: new ObjectId('000000000000000000000001') as any,
  failedPasswordCheckCount: 0,
  previousPasswords: [],
  verifiedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
}

export default [admin, user]
