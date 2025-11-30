import { BaseModel, column, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import Lesson from '../course/lesson.js'
import TaskOption from './task_option.js'
import TaskExample from './task_example.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class Task extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare lessonId: number

  @column()
  declare title: string

  @column()
  declare description: string

  @column()
  declare type: 'quiz' | 'code' | 'text'

  @column()
  declare order: number

  @column()
  declare language: string
  
  @column()
  declare correctOutput: string

  @column()
  declare startCode: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
  
  // Отношения
  @belongsTo(() => Lesson, { foreignKey: 'lessonId' })
  declare lesson: BelongsTo<typeof Lesson>

  @hasMany(() => TaskOption)
  declare options: HasMany<typeof TaskOption>

  @hasMany(() => TaskExample)
  declare examples: HasMany<typeof TaskExample>

}
