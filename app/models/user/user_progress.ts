import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Course from '../course/course.js'
import Lesson from '../course/lesson.js'
import { DateTime } from 'luxon'

export default class UserProgress extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare courseId: number

  @column()
  declare lessonId: number

  @column()
  declare progressPercent: number

  @column()
  declare isCompleted: boolean

  @column.dateTime()
  declare lastViewedAt: DateTime | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Course)
  declare course: BelongsTo<typeof Course>

  @belongsTo(() => Lesson)
  declare lesson: BelongsTo<typeof Lesson>
}
