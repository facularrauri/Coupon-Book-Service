import { model, Schema, Types } from 'mongoose'

export interface IRole {
  _id: Types.ObjectId
  name: string
  description?: string
  audience: string[]
  permissions: string[]
  createdAt: Date
  updatedAt: Date
  updatedBy?: Types.ObjectId
}

const roleSchema: Schema = new Schema<IRole>({
  name: { type: String, required: true, lowercase: true, trim: true },
  description: { type: String, trim: true },
  audience: [{ type: String }],
  permissions: [{ type: String, ref: 'Permission' }],
  createdAt: { type: Date },
  updatedAt: { type: Date },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'user' },
})

export const RoleModel = model<IRole>('Role', roleSchema)
