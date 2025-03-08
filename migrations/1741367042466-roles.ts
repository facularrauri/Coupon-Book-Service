import type { Connection } from 'mongoose'
import { roles } from '../seeders/roles'

export async function up(db: Connection): Promise<void> {
  await db.collection('roles').insertMany(roles)
}

export async function down(db: Connection): Promise<void> {
  await db.collection('roles').deleteMany({ _id: { $in: roles.map((r) => r._id) } })
}
