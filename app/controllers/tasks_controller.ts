// app/controllers/tasks_controller.ts
import Course from '#models/course/course'
import Lesson from '#models/course/lesson'
import Module from '#models/course/module'
import Task from '#models/task/task'
import { taskValidator } from '#validators/task'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'


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

    // 1. Получаем задачу
    const task = await Task.query().where('id', taskId).firstOrFail()

    // 2. Валидация входных данных в зависимости от типа
    const payload = await this.validateRequest(task.type, request)

    // 3. Проверка ответа
    const isCorrect = await this.evaluateAnswer(task, payload)

    // 4. Ответ
    if (isCorrect) {
      return response.ok({
        correct: true,
        message: 'Correct',
      })
    } else {
      return response.badRequest({
        correct: false,
        message: 'Wrong!',
      })
    }
  }

  private async validateRequest(type: string, request: HttpContext['request']) {
    const schemas = {
      quiz: vine.object({
        selectedOptionId: vine.number(),
      }),
      code: vine.object({
        output: vine.string().trim(),
      }),
      text: vine.object({
        answer: vine.string().trim(),
      }),
    }

    const validator = vine.compile(schemas[type as keyof typeof schemas] || vine.object({}))
    return validator.validate(request.body())
  }

  private async evaluateAnswer(task: Task, payload: any): Promise<boolean> {
    switch (task.type) {
      case 'quiz': {
        // ВАЖНО: preload options!
        await task.load('options')

        const option = task.options.find((opt) => opt.id === payload.selectedOptionId)
        console.log(option)
        return option?.isCorrect == true
      }

      case 'code': {
        const expected = (task.correctOutput || '').trim()
        const received = (payload.output || '').trim()
        return expected === received
      }

      case 'text': {
        const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
        const expected = normalize(task.correctOutput || '')
        const received = normalize(payload.answer || '')
        return expected === received
      }

      default:
        return false
    }
  }
}