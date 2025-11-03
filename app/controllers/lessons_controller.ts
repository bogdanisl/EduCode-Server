// app/controllers/lessons_controller.ts
import Course from '#models/course/course'
import Lesson from '#models/course/lesson'
import Module from '#models/course/module'
import { lessonValidator } from '#validators/lesson'
import type { HttpContext } from '@adonisjs/core/http'


export default class LessonsController {
    /**
     * GET /modules/:moduleId/lessons
     * Получить все уроки модуля
     */
    async index({ params, response }: HttpContext) {
        const moduleId = params.moduleId

        try {
            const lessons = await Lesson.query()
                .where('module_id', moduleId)
                .orderBy('order', 'asc')
                .preload('tasks', (tasksQuery) => {
                    tasksQuery.preload('options').orderBy('order', 'asc')
                })

            return response.ok({ lessons })
        } catch (error) {
            return response.internalServerError({
                message: 'Failed to fetch lessons',
                error: error.message,
            })
        }
    }

    /**
     * POST /modules/:moduleId/lessons
     * Создать урок (только владелец курса)
     */
    async store({ auth, params, request, response }: HttpContext) {
        
        const user = auth.user!
        const moduleId = params.moduleId
        const data = await request.validateUsing(lessonValidator)

        try {
            // Проверка: пользователь — владелец курса?
            const module = await Module.findOrFail(moduleId)
            const course = await Course.findOrFail(module.courseId)

            if (course.createdBy !== user.id) {
                return response.forbidden({ message: 'You can only add lessons to your own course' })
            }

            // Автоинкремент order
            const lastLesson = await Lesson.query()
                .where('module_id', moduleId)
                .orderBy('order', 'desc')
                .first()

            const newOrder = lastLesson ? lastLesson.order + 1 : 1

            const lesson = await Lesson.create({
                moduleId,
                title: data.title,
                description: data.description,
                difficultyLevel: data.difficultyLevel,
                order: newOrder,
            })

            return response.created({ lesson })
        } catch (error) {
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.notFound({ message: 'Module not found' })
            }
            return response.badRequest({ error: error.message })
        }
    }

    /**
     * GET /lessons/:id
     * Получить один урок
     */
    async show({ params, response }: HttpContext) {
        const lessonId = params.id

        try {
            const lesson = await Lesson.query()
                .where('id', lessonId)
                .preload('module')
                .preload('tasks', (tasksQuery) => {
                    tasksQuery
                        .orderBy('order', 'asc')
                        .preload('options', (optionsQuery) => {
                            optionsQuery.orderBy('order', 'asc')
                        })
                })
                .firstOrFail()

            return response.ok({ lesson })
        } catch (error) {
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.notFound({ message: 'Lesson not found' })
            }
            return response.internalServerError({ error: error.message })
        }
    }

    /**
     * PATCH /lessons/:id
     * Обновить урок
     */
    async update({ auth, params, request, response }: HttpContext) {
        //await auth.use('web').authenticate()
        const user = auth.user!
        const lessonId = params.id
        const data = await request.validateUsing(lessonValidator)

        try {
            const lesson = await Lesson.findOrFail(lessonId)
            const module = await Module.findOrFail(lesson.moduleId)
            const course = await Course.findOrFail(module.courseId)

            if (course.createdBy !== user.id) {
                return response.forbidden({ message: 'Access denied' })
            }

            lesson.merge({
                title: data.title,
                description: data.description,
                difficultyLevel: data.difficultyLevel,
            })

            await lesson.save()

            return response.ok({ lesson })
        } catch (error) {
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.notFound({ message: 'Lesson not found' })
            }
            return response.badRequest({ error: error.message })
        }
    }

    /**
     * DELETE /lessons/:id
     * Удалить урок (и все задания с вариантами — CASCADE)
     */
    async destroy({ auth, params, response }: HttpContext) {
        //await auth.use('web').authenticate()
        const user = auth.user!
        const lessonId = params.id

        try {
            const lesson = await Lesson.findOrFail(lessonId)
            const module = await Module.findOrFail(lesson.moduleId)
            const course = await Course.findOrFail(module.courseId)

            if (course.createdBy !== user.id) {
                return response.forbidden({ message: 'Access denied' })
            }

            await lesson.delete()

            return response.ok({ message: 'Lesson deleted successfully' })
        } catch (error) {
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.notFound({ message: 'Lesson not found' })
            }
            return response.internalServerError({ error: error.message })
        }
    }

    /**
     * PATCH /lessons/:id/reorder
     * Переставить урок в модуле
     */
    async reorder({ auth, params, request, response }: HttpContext) {
        //await auth.use('web').authenticate()
        const user = auth.user!
        const lessonId = params.id
        const { newOrder } = request.only(['newOrder'])

        if (!Number.isInteger(newOrder) || newOrder < 1) {
            return response.badRequest({ message: 'newOrder must be a positive integer' })
        }

        try {
            const lesson = await Lesson.findOrFail(lessonId)
            const module = await Module.findOrFail(lesson.moduleId)
            const course = await Course.findOrFail(module.courseId)

            if (course.createdBy !== user.id) {
                return response.forbidden({ message: 'Access denied' })
            }

            const oldOrder = lesson.order

            if (oldOrder === newOrder) {
                return response.ok({ message: 'No change' })
            }

            // Перестановка
            if (oldOrder < newOrder) {
                await Lesson.query()
                    .where('module_id', module.id)
                    .where('order', '>', oldOrder)
                    .where('order', '<=', newOrder)
                    .decrement('order', 1)
            } else {
                await Lesson.query()
                    .where('module_id', module.id)
                    .where('order', '>=', newOrder)
                    .where('order', '<', oldOrder)
                    .increment('order', 1)
            }

            lesson.order = newOrder
            await lesson.save()

            return response.ok({ message: 'Lesson reordered' })
        } catch (error) {
            return response.internalServerError({ error: error.message })
        }
    }
}