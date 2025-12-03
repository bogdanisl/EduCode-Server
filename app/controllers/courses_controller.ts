// import type { HttpContext } from '@adonisjs/core/http'

import Course from "#models/course/course";
import Lesson from "#models/course/lesson";
import Module from "#models/course/module";
import Task from "#models/task/task";
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
    const data = request.only(['title', 'description', 'difficulty', 'categoryId', 'modules'])
    const cover = request.file('cover')

    console.log("Incoming data:", data)

    // Парсим modules (т.к. с фронта приходит строка)
    let modules = []
    try {
      modules = typeof data.modules === 'string' ? JSON.parse(data.modules) : data.modules
    } catch (e) {
      return response.badRequest({ error: "Invalid modules format" })
    }

    // Создаём курс
    const course = await Course.create({
      title: data.title,
      description: data.description,
      difficulty: data.difficulty,
      categoryId: Number(data.categoryId),
      createdBy: auth.user!.id
    })

    // Загружаем обложку
    if (cover) {
      if (!cover.isValid) {
        return response.badRequest({ error: cover.errors })
      }
      await cover.move('public/assets/courses/covers', { name: `${course.id}.png` })
    }

    // ============================
    //   СОЗДАЁМ МОДУЛИ
    // ============================

    for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
      const moduleFromClient = modules[moduleIndex]

      const createdModule = await Module.create({
        courseId: course.id,
        title: moduleFromClient.title,
        description: moduleFromClient.description || null,
        order: moduleIndex, // правильный порядок
      })

      const lessons = moduleFromClient.lessons || []

      // ============================
      //   СОЗДАЁМ УРОКИ
      // ============================

      for (let lessonIndex = 0; lessonIndex < lessons.length; lessonIndex++) {
        const lessonFromClient = lessons[lessonIndex]

        const createdLesson = await Lesson.create({
          moduleId: createdModule.id,
          title: lessonFromClient.title,
          description: lessonFromClient.description || null,
          difficultyLevel: lessonFromClient.difficultyLevel || null,
          order: lessonIndex, // правильный порядок
        })

        const tasks = lessonFromClient.tasks || []

        // ============================
        //   СОЗДАЁМ ЗАДАНИЯ
        // ============================

        for (let taskIndex = 0; taskIndex < tasks.length; taskIndex++) {
          const taskFromClient = tasks[taskIndex]

          const createdTask = await Task.create({
            lessonId: createdLesson.id,
            title: taskFromClient.title,
            description: taskFromClient.description,
            type: taskFromClient.type,
            order: taskIndex, // правильный порядок
            language: taskFromClient.language || "",     // обязательно
            correctOutput: taskFromClient.expectedText || taskFromClient.correctOutput || "",
            startCode: taskFromClient.startCode || "",
          })

          // Если будут options/examples — напишу также
        }
      }
    }

    

    return response.ok({
      message: "Course created successfully",
      courseId: course.id
    })
  }
  async show({ params, auth, response }: HttpContext) {
    const courseId = Number(params.id)
    console.log('Course show')
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