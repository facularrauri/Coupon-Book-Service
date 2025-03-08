import type { Connection } from 'mongoose'
import users from '../seeders/users'

export async function up(db: Connection): Promise<void> {
  await db.collection('users').insertMany(users)
}

export async function down(db: Connection): Promise<void> {
  await db.collection('users').deleteMany({ _id: { $in: users.map((r) => r._id) } })
}
