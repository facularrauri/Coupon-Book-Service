import { IRole } from '../src/components'

import { ROLE_DEFINITIONS } from '../src/interfaces/permissions'

import { ObjectId } from 'mongodb'

const admin: IRole = {
  _id: new ObjectId('000000000000000000000000'),
  name: 'admin',
  permissions: ROLE_DEFINITIONS.ADMIN,
  audience: ['web', 'mobile'],
  createdAt: new Date(),
  updatedAt: new Date(),
}

const user: IRole = {
  _id: new ObjectId('000000000000000000000001'),
  name: 'user',
  audience: ['web', 'mobile'],
  permissions: ROLE_DEFINITIONS.USER,
  createdAt: new Date(),
  updatedAt: new Date(),
}

export const roles = [admin, user]
