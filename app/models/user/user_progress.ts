import { BaseModel, column, belongsTo, computed } from '@adonisjs/lucid/orm'
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
  declare isCompleted: boolean

  @column()
  declare completedLessonsCount: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare lastViewedAt: DateTime | null




  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Course)
  declare course: BelongsTo<typeof Course>

  @belongsTo(() => Lesson)
  declare lesson: BelongsTo<typeof Lesson>

  @computed()
  get progressPercent() {
    if (!this.course || this.course.totalLessonsCount === 0) {
      return 0
    }
    if(this.isCompleted) return 100
    return Math.floor(
      (this.completedLessonsCount / this.course.totalLessonsCount) * 100
    )
  }
}
