// app/controllers/task_options_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import Course from '#models/course/course'
import Lesson from '#models/course/lesson'
import Module from '#models/course/module'
import Task from '#models/task/task'
import TaskOption from '#models/task/task_option'
import { taskOptionValidator } from '#validators/task_option'

export default class TaskOptionsController {
  /**
   * GET /tasks/:taskId/options
   * Получить все варианты ответа задания
   */
  async index({ params, response }: HttpContext) {
    const taskId = params.taskId

    try {
      const options = await TaskOption.query()
        .where('task_id', taskId)
        .orderBy('order', 'asc')

      return response.ok({ options })
    } catch (error) {
      return response.internalServerError({
        message: 'Failed to fetch options',
        error: error.message,
      })
    }
  }

  /**
   * POST /tasks/:taskId/options
   * Создать вариант ответа (только владелец курса)
   */
  async store({ auth, params, request, response }: HttpContext) {
    //await auth.use('web').authenticate()
    const user = auth.user!
    const taskId = params.taskId
    const data = await request.validateUsing(taskOptionValidator)

    try {
      // Проверка прав: владелец курса
      const task = await Task.findOrFail(taskId)
      const lesson = await Lesson.findOrFail(task.lessonId)
      const module = await Module.findOrFail(lesson.moduleId)
      const course = await Course.findOrFail(module.courseId)

      if (course.createdBy !== user.id) {
        return response.forbidden({ message: 'You can only add options to your own course' })
      }

      // Автоинкремент order
      const lastOption = await TaskOption.query()
        .where('task_id', taskId)
        .orderBy('order', 'desc')
        .first()

      const newOrder = lastOption ? lastOption.order + 1 : 1

      const option = await TaskOption.create({
        taskId,
        text: data.text,
        isCorrect: data.isCorrect || false,
        order: newOrder,
      })

      return response.created({ option })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ message: 'Task not found' })
      }
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * GET /task-options/:id
   * Получить один вариант ответа
   */
  async show({ params, response }: HttpContext) {
    const optionId = params.id

    try {
      const option = await TaskOption.query()
        .where('id', optionId)
        .preload('task')
        .firstOrFail()

      return response.ok({ option })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ message: 'Option not found' })
      }
      return response.internalServerError({ error: error.message })
    }
  }

  /**
   * PATCH /task-options/:id
   * Обновить вариант ответа
   */
  async update({ auth, params, request, response }: HttpContext) {
    //await auth.use('web').authenticate()
    const user = auth.user!
    const optionId = params.id
    const data = await request.validateUsing(taskOptionValidator)

    try {
      const option = await TaskOption.findOrFail(optionId)
      const task = await Task.findOrFail(option.taskId)
      const lesson = await Lesson.findOrFail(task.lessonId)
      const module = await Module.findOrFail(lesson.moduleId)
      const course = await Course.findOrFail(module.courseId)

      if (course.createdBy !== user.id) {
        return response.forbidden({ message: 'Access denied' })
      }

      option.merge({
        text: data.text,
        isCorrect: data.isCorrect || false,
      })

      await option.save()

      return response.ok({ option })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ message: 'Option not found' })
      }
      return response.badRequest({ error: error.message })
    }
  }

  /**
   * DELETE /task-options/:id
   * Удалить вариант ответа
   */
  async destroy({ auth, params, response }: HttpContext) {
    //await auth.use('web').authenticate()
    const user = auth.user!
    const optionId = params.id

    try {
      const option = await TaskOption.findOrFail(optionId)
      const task = await Task.findOrFail(option.taskId)
      const lesson = await Lesson.findOrFail(task.lessonId)
      const module = await Module.findOrFail(lesson.moduleId)
      const course = await Course.findOrFail(module.courseId)

      if (course.createdBy !== user.id) {
        return response.forbidden({ message: 'Access denied' })
      }

      await option.delete()

      return response.ok({ message: 'Option deleted successfully' })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({ message: 'Option not found' })
      }
      return response.internalServerError({ error: error.message })
    }
  }

  /**
   * PATCH /task-options/:id/reorder
   * Переставить вариант ответа
   */
  async reorder({ auth, params, request, response }: HttpContext) {
    //await auth.use('web').authenticate()
    const user = auth.user!
    const optionId = params.id
    const { newOrder } = request.only(['newOrder'])

    if (!Number.isInteger(newOrder) || newOrder < 1) {
      return response.badRequest({ message: 'newOrder must be a positive integer' })
    }

    try {
      const option = await TaskOption.findOrFail(optionId)
      const task = await Task.findOrFail(option.taskId)
      const lesson = await Lesson.findOrFail(task.lessonId)
      const module = await Module.findOrFail(lesson.moduleId)
      const course = await Course.findOrFail(module.courseId)

      if (course.createdBy !== user.id) {
        return response.forbidden({ message: 'Access denied' })
      }

      
      const oldOrder = option.order

      if (oldOrder === newOrder) {
        return response.ok({ message: 'No change' })
      }

      // Перестановка
      if (oldOrder < newOrder) {
        await TaskOption.query()
          .where('task_id', task.id)
          .where('order', '>', oldOrder)
          .where('order', '<=', newOrder)
          .decrement('order', 1)
      } else {
        await TaskOption.query()
          .where('task_id', task.id)
          .where('order', '>=', newOrder)
          .where('order', '<', oldOrder)
          .increment('order', 1)
      }

      option.order = newOrder
      await option.save()

      return response.ok({ message: 'Option reordered' })
    } catch (error) {
      return response.internalServerError({ error: error.message })
    }
  }
}