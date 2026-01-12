import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import Task from './task.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class TaskOption extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare taskId: number

  @column()
  declare text: string

  @column()
  declare isCorrect: boolean

  @column()
  declare order: number


  @belongsTo(() => Task)
  declare task: BelongsTo<typeof Task>
}
