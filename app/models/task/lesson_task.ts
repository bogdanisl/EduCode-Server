import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import Lesson from '../course/lesson.js'
import Task from './task.js'
import type { BelongsTo }  from '@adonisjs/lucid/types/relations'

export default class LessonTask extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare lessonId: number

  @column()
  declare taskId: number

  @column()
  declare order: number

  @belongsTo(() => Lesson)
  declare lesson: BelongsTo<typeof Lesson>

  @belongsTo(() => Task)
  declare task: BelongsTo<typeof Task>
}
