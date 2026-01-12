import { afterCreate, afterDelete, BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

import { DateTime } from 'luxon'
import Task from '#models/task/task'
import Module from './module.js'

export default class Lesson extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare moduleId: number

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column()
  declare difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | null

  @column()
  declare order: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Отношения
  @belongsTo(() => Module, { foreignKey: 'moduleId' })
  declare module: BelongsTo<typeof Module>

  @hasMany(() => Task, { foreignKey: 'lessonId' })
  declare tasks: HasMany<typeof Task>

  @afterCreate()
  public static async afterCreateHook(lesson: Lesson) {
    const module = await Module.find(lesson.moduleId)

    if (!module) return

    await module.load('course')
    await module.course.recalcTotalLessonsCount()
  }

  @afterDelete()
  public static async afterDeleteHook(lesson: Lesson) {
    const module = await Module.find(lesson.moduleId)
    if (!module) return

    await module.load('course')
    await module.course.recalcTotalLessonsCount()
  }
}
