import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Course from './course.js'
import { DateTime } from 'luxon'
import Task from '#models/task/task'

export default class Lesson extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column()
  declare difficulty_level: string | null

  @column()
  declare video_urls: string | null // JSON stringified array

  @column()
  declare article_links: string | null // JSON stringified array

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @manyToMany(() => Course, {
    pivotTable: 'course_lessons',
  })
  declare courses: ManyToMany<typeof Course>

  @manyToMany(() => Task, {
    pivotTable: 'lesson_tasks',
    pivotColumns: ['order'],
  })
  declare tasks: ManyToMany<typeof Task>

}
