import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import CourseCategory from './course_category.js'
import { DateTime } from 'luxon'

export default class Course extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare description: string

  @column()
  declare difficulty: string // наприклад: 'beginner' | 'intermediate' | 'advanced'

  @column()
  declare categoryId: number

 @belongsTo(() => CourseCategory, {
    foreignKey: 'categoryId',
  })
  declare category: BelongsTo<typeof CourseCategory>

  @column()
  declare createdBy: number // ID користувача, який створив курс

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
