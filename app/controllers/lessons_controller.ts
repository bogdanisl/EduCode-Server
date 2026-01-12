// app/controllers/lessons_controller.ts
import Lesson from '#models/course/lesson'
import type { HttpContext } from '@adonisjs/core/http'


export default class LessonsController {

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
}