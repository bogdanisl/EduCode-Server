import { BaseModel, column, hasMany, belongsTo, manyToMany } from '@adonisjs/lucid/orm'
import Lesson from '../course/lesson.js'
import TaskOption from './task_option.js'
import TaskExample from './task_example.js'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'

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
  declare type: string // quiz | code | text

  @column()
  declare order: number

  @belongsTo(() => Lesson)
  declare lesson: BelongsTo<typeof Lesson>

  @hasMany(() => TaskOption)
  declare options: HasMany<typeof TaskOption>

  @hasMany(() => TaskExample)
  declare examples: HasMany<typeof TaskExample>
  @manyToMany(() => Lesson, {
    pivotTable: 'lesson_tasks',
    pivotColumns: ['order'],
  })
  declare lessons: ManyToMany<typeof Lesson>
}
