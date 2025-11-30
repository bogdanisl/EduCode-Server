// app/controllers/tasks_controller.ts
import Course from '#models/course/course'
import Lesson from '#models/course/lesson'
import Module from '#models/course/module'
import Task from '#models/task/task'
import CloudCodeRunnerService from '#services/code-runner.service'
import { taskValidator } from '#validators/task'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'

const runner = new CloudCodeRunnerService()

export default class TasksController {

  /**
   * GET /lessons/:lessonId/tasks
   * Получить все задания урока
   */
  async index({ params, response }: HttpContext) {
    const lessonId = params.lessonId

    try {
      const tasks = await Task.query()
        .where('lesson_id', lessonId)
        .orderBy('order', 'asc')
        .preload('options', (optionsQuery) => {
          optionsQuery.orderBy('order', 'asc')
        })

      return response.ok({ tasks })
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to fetch tasks',
        error: error.message,
      })
    }
  }

  /**
   * POST /lessons/:lessonId/tasks
   * Создать задание (только владелец курса)
   */
  async store({ auth, params, request, response }: HttpContext) {
    //await auth.use('web').authenticate()
    const user = auth.user!
    const lessonId = params.lessonId
    const data = await request.validateUsing(taskValidator)

    try {
      // Проверка прав: владелец курса
      const lesson = await Lesson.findOrFail(lessonId)
      const module = await Module.findOrFail(lesson.moduleId)
      const course = await Course.findOrFail(module.courseId)

      if (course.createdBy !== user.id) {
        return response.forbidden({ message: 'You can only add tasks to your own course' })
      }

      // Автоинкремент order
      const lastTask = await Task.query()
        .where('lesson_id', lessonId)
        .orderBy('order', 'desc')
        .first()

      const newOrder = lastTask ? lastTask.order + 1 : 1

      const task = await Task.create({
        lessonId,
        title: data.title,
        description: data.description,
        type: data.type,
        order: newOrder,
      })

      // Создаём варианты ответа (если переданы)
      if (data.options && Array.isArray(data.options)) {
        const options = data.options.map((opt: any, index: number) => ({
          taskId: task.id,
          text: opt.text,
          isCorrect: opt.isCorrect || false,
          order: index + 1,
        }))
        await task.related('options').createMany(options)
      }

      await task.load('options')

      return response.created({ task })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ message: 'Lesson not found' })
      }
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * GET /tasks/:id
   * Получить одно задание
   */
  async show({ params, response }: HttpContext) {
    const taskId = params.id

    try {
      const task = await Task.query()
        .where('id', taskId)
        .preload('lesson')
        .preload('options', (optionsQuery) => {
          optionsQuery.orderBy('order', 'asc')
        })
        .firstOrFail()

      return response.ok({ task })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ message: 'Task not found' })
      }
      return response.internalServerError({ error: error.message })
    }
  }

  /**
   * PATCH /tasks/:id
   * Обновить задание
   */
  async update({ auth, params, request, response }: HttpContext) {
    //await auth.use('web').authenticate()
    const user = auth.user!
    const taskId = params.id
    const data = await request.validateUsing(taskValidator)

    try {
      const task = await Task.findOrFail(taskId)
      const lesson = await Lesson.findOrFail(task.lessonId)
      const module = await Module.findOrFail(lesson.moduleId)
      const course = await Course.findOrFail(module.courseId)

      if (course.createdBy !== user.id) {
        return response.forbidden({ message: 'Access denied' })
      }

      task.merge({
        title: data.title,
        description: data.description,
        type: data.type,
      })

      await task.save()

      // Обновляем варианты ответа (если переданы)
      if (data.options && Array.isArray(data.options)) {
        // Удаляем старые
        await task.related('options').query().delete()

        // Создаём новые
        const options = data.options.map((opt: any, index: number) => ({
          taskId: task.id,
          text: opt.text,
          isCorrect: opt.isCorrect || false,
          order: index + 1,
        }))
        await task.related('options').createMany(options)
      }

      await task.load('options')

      return response.ok({ task })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ message: 'Task not found' })
      }
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * DELETE /tasks/:id
   * Удалить задание (и все варианты — CASCADE)
   */
  async destroy({ auth, params, response }: HttpContext) {
    //await auth.use('web').authenticate()
    const user = auth.user!
    const taskId = params.id

    try {
      const task = await Task.findOrFail(taskId)
      const lesson = await Lesson.findOrFail(task.lessonId)
      const module = await Module.findOrFail(lesson.moduleId)
      const course = await Course.findOrFail(module.courseId)

      if (course.createdBy !== user.id) {
        return response.forbidden({ message: 'Access denied' })
      }

      await task.delete()

      return response.ok({ message: 'Task deleted successfully' })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ message: 'Task not found' })
      }
      return response.internalServerError({ error: error.message })
    }
  }

  /**
   * PATCH /tasks/:id/reorder
   * Переставить задание в уроке
   */
  async reorder({ auth, params, request, response }: HttpContext) {
    //await auth.use('web').authenticate()
    const user = auth.user!
    const taskId = params.id
    const { newOrder } = request.only(['newOrder'])

    if (!Number.isInteger(newOrder) || newOrder < 1) {
      return response.badRequest({ message: 'newOrder must be a positive integer' })
    }

    try {
      const task = await Task.findOrFail(taskId)
      const lesson = await Lesson.findOrFail(task.lessonId)
      const module = await Module.findOrFail(lesson.moduleId)
      const course = await Course.findOrFail(module.courseId)

      if (course.createdBy !== user.id) {
        return response.forbidden({ message: 'Access denied' })
      }

      const oldOrder = task.order

      if (oldOrder === newOrder) {
        return response.ok({ message: 'No change' })
      }

      // Перестановка
      if (oldOrder < newOrder) {
        await Task.query()
          .where('lesson_id', lesson.id)
          .where('order', '>', oldOrder)
          .where('order', '<=', newOrder)
          .decrement('order', 1)
      } else {
        await Task.query()
          .where('lesson_id', lesson.id)
          .where('order', '>=', newOrder)
          .where('order', '<', oldOrder)
          .increment('order', 1)
      }

      task.order = newOrder
      await task.save()

      return response.ok({ message: 'Task reordered' })
    } catch (error) {
      return response.internalServerError({ error: error.message })
    }
  }

  async check({ params, request, response }: HttpContext) {
    const taskId = Number(params.id)
    const task = await Task.query().where('id', taskId).preload('options').firstOrFail()

    let isCorrect = false
    let extra: any = {}

    switch (task.type) {
      case 'quiz': {
        const { selectedOptionId } = await this.validateQuiz(request)
        console.log(selectedOptionId)
        await task.load('options')
        const option = task.options.find((opt) => opt.id === selectedOptionId)
        isCorrect = option?.isCorrect == true
        break
      }

      case 'text': {
        const { answer } = await this.validateText(request)
        const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
        isCorrect = normalize(task.correctOutput || '') === normalize(answer)
        break
      }

      case 'code': {
        const { code } = await this.validateCode(request)

        // Запускаем код через Judge0 Cloud
        const result = await runner.execute(code, task.language === 'javascript' ? 63 : 74)

        const expected = (task.correctOutput || '').trim()
        const received = result.output.trim()

        isCorrect = result.success && received === expected

        // Возвращаем всё, что нужно фронтенду
        extra = {
          output: result.output,
          console: result.console,
          error: result.error,
        }

        break
      }

      default:
        return response.badRequest({ message: 'Unknown task type' })
    }

    return response.json({
      correct: isCorrect,
      ...extra,
    })
  }

  private async validateQuiz(request: HttpContext['request']) {
    const schema = vine.object({ selectedOptionId: vine.number() })
    const validator = vine.compile(schema)
    return validator.validate(request.body())
  }

  private async validateText(request: HttpContext['request']) {
    const schema = vine.object({ answer: vine.string().trim() })
    const validator = vine.compile(schema)
    return validator.validate(request.body())
  }

  private async validateCode(request: HttpContext['request']) {
    const schema = vine.object({ code: vine.string() })
    const validator = vine.compile(schema)
    return validator.validate(request.body())
  }

}