// import type { HttpContext } from '@adonisjs/core/http'

import Course from "#models/course/course";
import UserProgress from "#models/user/user_progress";
import { HttpContext } from "@adonisjs/core/http";

export default class CoursesController {
  async index({ response, request }: HttpContext) {
    const limit = Number(request.qs().limit) || 10
    const offset = Number(request.qs().offset) || 0
    const categoryId = Number(request.qs().category)

    try {
      const courses = await Course.query()
        .if(categoryId, (query) => {
          query.where('category_id', categoryId)
        })
        .orderBy('created_at', 'desc')
        .offset(offset)
        .limit(limit)

      return response.ok(courses)
    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching latest courses',
        error: error.message,
      })
    }
  }
  async store({ auth, request, response }: HttpContext) {
    const data = request.only(['title', 'description', 'difficulty', 'categoryId'])
    const cover = request.file('cover')



    const course = await Course.create({
      ...data,
      createdBy: auth.user!.id
    })

    if (cover) {
      if (!cover.isValid) {
        return response.badRequest({ error: cover.errors })
      }
      await cover.move('public/assets/courses/covers', { name: `${course.id}.png` })
    }


    return response.created({ course })
  }
  async show({ params, auth, response }: HttpContext) {
    const courseId = Number(params.id)

    try {
      // Загружаем курс со всей структурой
      const course = await Course.query()
        .where('id', courseId)
        .preload('category')
        .preload('modules', (modulesQuery) => {
          modulesQuery
            .orderBy('order', 'asc')
            .preload('lessons', (lessonsQuery) => {
              lessonsQuery
                .orderBy('order', 'asc')
                .preload('tasks', (tasksQuery) => {
                  tasksQuery
                    .orderBy('order', 'asc')
                    .preload('options', (optionsQuery) => {
                      optionsQuery.orderBy('order', 'asc')
                    })
                })
            })
        })
        .first()

      if (!course) {
        return response.notFound({ message: 'Course not found' })
      }

      // Проверяем, авторизован ли пользователь
      const user = auth.user
      //console.log(user)
      let enrolled = null

      if (user) {
        enrolled = await UserProgress.query()
          .where('user_id', user.id)
          .where('course_id', course.id)
          .first()
      }

      // Возвращаем курс + информацию о записи (если есть)
      return response.ok({
        course,
        enrolled
      })

    } catch (error) {
      console.error('Error in CourseController.show:', error)
      return response.internalServerError({
        message: 'Ошибка при загрузке курса',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
  async update({ auth, params, request, response }: HttpContext) {
    const course = await Course.findOrFail(params.id)

    // Опционально: проверка прав (только создатель или админ)
    if (course.createdBy !== auth.user!.id) {
      return response.forbidden({ message: 'Access denied' })
    }

    const data = request.only(['title', 'description', 'difficulty', 'categoryId'])
    const cover = request.file('cover')

    if (cover) {
      if (!cover.isValid) return response.badRequest({ error: cover.errors })

      course.merge(data)
      await course.save()

      return response.ok({ course })
    }
  }
  async destroy({ params, response }: HttpContext) {
    const course = await Course.findOrFail(params.id)

    if (!course) {
      return response.notFound()
    }
    //await Drive.use().delete(`public/course/cover/${fileName}`) <== TODO: Delete images
    await course.delete()
    return response.ok({ message: 'Course deleted' })
  }
}