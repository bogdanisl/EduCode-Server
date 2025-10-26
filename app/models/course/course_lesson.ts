import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Course from './course.js'
import Lesson from './lesson.js'

export default class CourseLesson extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare courseId: number

  @column()
  declare lessonId: number

  @column()
  declare order: number | null

  @belongsTo(() => Course)
  declare course: BelongsTo<typeof Course>

  @belongsTo(() => Lesson)
  declare lesson: BelongsTo<typeof Lesson>
}
