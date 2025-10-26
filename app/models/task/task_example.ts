import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Task from './task.js'

export default class TaskExample extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare taskId: number

  @column()
  declare input: string

  @column()
  declare expectedOutput: string

  @column()
  declare explanation: string | null

  @belongsTo(() => Task)
  declare task: BelongsTo<typeof Task>
}
