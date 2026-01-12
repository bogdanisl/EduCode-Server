// import type { HttpContext } from '@adonisjs/core/http'

import Course from "#models/course/course";
import UserProgress from "#models/user/user_progress";
import { HttpContext } from "@adonisjs/core/http";
import { DateTime } from "luxon";

export default class UserProgressController {

    async enroll({ auth, response, params }: HttpContext) {
        const user = auth.user!
        const courseId = Number(params.courseId)

        if (!user) {
            return response.unauthorized()
        }

        try {
            const course = await Course.query()
                .where('id', courseId)
                .preload('modules', (modulesQuery) => {
                    modulesQuery.preload('lessons').orderBy('order', 'asc')
                })
                .first()

            if (!course) {
                return response.notFound({ message: 'Course not found' })
            }

            const alreadyEnrolled = await UserProgress.query()
                .where('user_id', user.id)
                .where('course_id', courseId)
                .first()

            if (alreadyEnrolled) {
                return response.badRequest({ message: 'Already enrolled in course' })
            }

            const firstModule = course.modules[0]
            const firstLesson = firstModule?.lessons[0]

            if (!firstModule || !firstLesson) {
                return response.badRequest({ message: 'Course has no lessons' })
            }

            const enrollment = await UserProgress.create({
                userId: user.id,
                courseId: courseId,
                isCompleted: false,
                lessonId: firstLesson.id,
                lastViewedAt: DateTime.now(),
            })

            return response.created({ enrollment })
        } catch (error) {
            console.error('Enrollment error:', error)
            return response.internalServerError({
                message: 'Error enrolling in course',
            })
        }
    }
    async index({ auth, response }: HttpContext) {
        const user = auth.user!
        if (!user) {
            return response.unauthorized();
        }
        try {
            const progresses = await UserProgress.query()
                .where('user_id', user.id)
                .preload('course')
                .preload('lesson')
            if (!progresses) {
                return response.noContent();
            }
            return response.ok({ progresses })
        } catch (error) {
            console.error('Fetch progresses error:', error)
            return response.internalServerError({
                message: 'Error fetching user progresses',
            })
        }
    }
}
