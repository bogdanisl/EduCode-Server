// import type { HttpContext } from '@adonisjs/core/http'

import Course from "#models/course/course"
import Module from "#models/course/module"
import { moduleValidator } from "#validators/module"
import { HttpContext } from "@adonisjs/core/http"

export default class ModulesController {
    async index({ response, request }: HttpContext) {
        const limit = Number(request.qs().limit) || 10
        const offset = Number(request.qs().offset) || 0
        try {
            const modules = await Module.query()
                .preload('lessons')
                .preload('course')
                .offset(offset)
                .limit(limit)
            if (modules.length < 1) {
                return response.noContent()
            }
            else {
                response.ok({modules})
            }
        }
        catch (err) {
            console.error('Fetching modules error: ' + err)
            return response.internalServerError({
                message: "Error fetching modules",
                error: err.message
            })
        }
    }
    /**
     * GET /courses/:courseId/modules
     * Получить все модули курса
     */
    async showByCourse({ params, response }: HttpContext) {
        const courseId = params.courseId

        try {
            const modules = await Module.query()
                .where('course_id', courseId)
                .orderBy('order', 'asc')
                .preload('lessons')

            return response.ok({ modules })
        } catch (error) {
            return response.internalServerError({
                message: 'Failed to fetch modules',
                error: error.message,
            })
        }
    }

    /**
     * POST /courses/:courseId/modules
     * Создать модуль (только владелец курса или админ)
     */
    async store({ auth, params, request, response }: HttpContext) {
        
        const user = auth.user!

        const courseId = params.courseId
        const data = await request.validateUsing(moduleValidator)

        try {
            // Проверка: пользователь — создатель курса?
            const course = await Course.findOrFail(courseId)
            if (course.createdBy !== user.id) { // CHANGE TO AUTH.USER.ID STUPID IDIOT< IF YOU DON'T, YA TYEABYA ZAJEBASHU KONCHENYJ DAUN
                return response.forbidden({ message: 'You can only add modules to your own course' })
            }

            // Автоинкремент order
            const lastModule = await Module.query()
                .where('course_id', courseId)
                .orderBy('order', 'desc')
                .first()

            const newOrder = lastModule ? lastModule.order + 1 : 1

            const module = await Module.create({
                courseId,
                title: data.title,
                description: data.description,
                order: newOrder,
            })

            return response.created({ module })
        } catch (error) {
            return response.badRequest({
                message: 'Failed to create module',
                error: error.message,
            })
        }
    }

    /**
     * GET /modules/:id
     * Получить один модуль
     */
    async show({ params, response }: HttpContext) {
        const moduleId = params.id

        try {
            const module = await Module.query()
                .where('id', moduleId)
                .preload('lessons', (lessonsQuery) => {
                    lessonsQuery.preload('tasks')
                })
                .firstOrFail()

            return response.ok({ module })
        } catch (error) {
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.notFound({ message: 'Module not found' })
            }
            return response.internalServerError({ error: error.message })
        }
    }

    /**
     * PATCH /modules/:id
     * Обновить модуль
     */
    async update({ auth, params, request, response }: HttpContext) {
        //await auth.use('web').authenticate()
        const user = auth.user!
        const moduleId = params.id
        const data = await request.validateUsing(moduleValidator)

        try {
            const module = await Module.findOrFail(moduleId)

            // Проверка прав
            const course = await Course.findOrFail(module.courseId)
            if (course.createdBy !== user.id) {
                return response.forbidden({ message: 'Access denied' })
            }

            module.merge({
                title: data.title,
                description: data.description,
            })

            await module.save()

            return response.ok({ module })
        } catch (error) {
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.notFound({ message: 'Module not found' })
            }
            return response.badRequest({ error: error.message })
        }
    }

    /**
     * DELETE /modules/:id
     * Удалить модуль (и все уроки, задания и т.д. — CASCADE)
     */
    async destroy({ auth, params, response }: HttpContext) {
        //await auth.use('web').authenticate()
        const user = auth.user!
        const moduleId = params.id

        try {
            const module = await Module.findOrFail(moduleId)

            // Проверка прав
            const course = await Course.findOrFail(module.courseId)
            if (course.createdBy !== user.id) {
                return response.forbidden({ message: 'Access denied' })
            }

            await module.delete()

            return response.ok({ message: 'Module deleted successfully' })
        } catch (error) {
            if (error.code === 'E_ROW_NOT_FOUND') {
                return response.notFound({ message: 'Module not found' })
            }
            return response.internalServerError({ error: error.message })
        }
    }

    /**
     * PATCH /modules/:id/reorder
     * Изменить порядок модулей (перетаскивание)
     */
    async reorder({ auth, params, request, response }: HttpContext) {
        //await auth.use('web').authenticate()
        const user = auth.user!
        const moduleId = params.id
        const { newOrder } = request.only(['newOrder'])

        if (!Number.isInteger(newOrder) || newOrder < 1) {
            return response.badRequest({ message: 'newOrder must be a positive integer' })
        }

        try {
            const module = await Module.findOrFail(moduleId)
            const course = await Course.findOrFail(module.courseId)

            if (course.createdBy !== user.id) {
                return response.forbidden({ message: 'Access denied' })
            }

            

            const oldOrder = module.order

            if (oldOrder === newOrder) {
                return response.ok({ message: 'No change in order' })
            }

            // Перестраиваем порядок
            if (oldOrder < newOrder) {
                // Сдвигаем вниз
                await Module.query()
                    .where('course_id', course.id)
                    .where('order', '>', oldOrder)
                    .where('order', '<=', newOrder)
                    .decrement('order', 1)
            } else {
                // Сдвигаем вверх
                await Module.query()
                    .where('course_id', course.id)
                    .where('order', '>=', newOrder)
                    .where('order', '<', oldOrder)
                    .increment('order', 1)
            }

            module.order = newOrder
            await module.save()

            return response.ok({ message: 'Module reordered' })
        } catch (error) {
            return response.internalServerError({ error: error.message })
        }
    }

}