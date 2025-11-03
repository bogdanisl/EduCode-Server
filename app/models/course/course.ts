// app/models/course.ts
import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany} from '@adonisjs/lucid/types/relations'

import CourseCategory from './course_category.js'
import Module from './module.js'

export default class Course extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare description: string

  @column()
  declare difficulty: 'beginner' | 'intermediate' | 'advanced'

  @column()
  declare categoryId: number

  @column()
  declare createdBy: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Отношения
  @belongsTo(() => CourseCategory, { foreignKey: 'categoryId' })
  declare category: BelongsTo<typeof CourseCategory>

  @hasMany(() => Module, { foreignKey: 'courseId' })
  declare modules: HasMany<typeof Module>
}