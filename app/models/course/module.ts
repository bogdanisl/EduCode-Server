import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import Lesson from './lesson.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Course from './course.js'


export default class Module extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare courseId: number

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column()
  declare order: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Отношения
  @belongsTo(() => Course, { foreignKey: 'courseId' })
  declare course: BelongsTo<typeof Course>

  @hasMany(() => Lesson, { foreignKey: 'moduleId' })
  declare lessons: HasMany<typeof Lesson>
}