// import type { HttpContext } from '@adonisjs/core/http'

import Course from "#models/course/course";
import Lesson from "#models/course/lesson";
import Module from "#models/course/module";
import Task from "#models/task/task";
import UserProgress from "#models/user/user_progress";
import { HttpContext } from "@adonisjs/core/http";
import db from '@adonisjs/lucid/services/db'


export default class CoursesController {
  async index({ response, request }: HttpContext) {
    const limit = Number(request.qs().limit) || 10
    const offset = Number(request.qs().offset) || 0

    const categoriesParam = request.qs().categories
    const difficultiesParam = request.qs().difficulties
    const searchText = request.qs().searchText;

    let categoryIds: number[] = []
    let difficulties: string[] = []

    // ---- categories ----
    if (Array.isArray(categoriesParam)) {
      categoryIds = categoriesParam.map(Number).filter(Boolean)
    }

    if (typeof categoriesParam === 'string') {
      categoryIds = categoriesParam.split(',').map(Number).filter(Boolean)
    }

    // ---- difficulties (string column) ----
    if (Array.isArray(difficultiesParam)) {
      difficulties = difficultiesParam.map(String).filter(Boolean)
    }

    if (typeof difficultiesParam === 'string') {
      difficulties = difficultiesParam.split(',').map(String).filter(Boolean)
    }

    try {
      const courses = await Course.query()
        .if(categoryIds.length > 0, (query) => {
          query.whereIn('category_id', categoryIds)
        })
        .if(difficulties.length > 0, (query) => {
          query.whereIn('difficulty', difficulties)
        })
        .if(searchText!== undefined && searchText.trim() !== '', (query) => {
          query.where('title', 'like', `%${searchText}%`)
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

    //console.log("Incoming data:", data)

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

          await Task.create({
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
  async update({ request, response, params, auth }: HttpContext) {
    const courseId = params.id

    const data = request.only(['title', 'description', 'difficulty', 'categoryId', 'price', 'modules'])
    const cover = request.file('cover')


    let modules = []
    try {
      modules = typeof data.modules === 'string' ? JSON.parse(data.modules) : data.modules
      if (!Array.isArray(modules)) throw new Error()
    } catch (e) {
      return response.badRequest({ error: "Invalid modules format" })
    }

    // Начинаем транзакцию — всё или ничего
    const trx = await db.transaction();

    try {
      // 1. Находим курс
      const course = await Course.find(courseId, { client: trx })
      if (!course) {
        await trx.rollback()
        return response.notFound({ error: "Course not found" })
      }
      const user = auth.user
      if (course.createdBy !== user?.id) {
        await trx.rollback();
        return response.unauthorized({ error: "You are not authorized to update this course" });
      }

      // 2. Обновляем основные поля
      course.merge({
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        categoryId: Number(data.categoryId),
      })
      await course.save()
      console.log(course);
      console.log(data.difficulty);

      // 3. Обрабатываем новую обложку (если пришла)
      if (cover) {
        if (!cover.isValid) {
          await trx.rollback()
          return response.badRequest({ error: cover.errors })
        }

        // Удаляем старую обложку, если была
        // const oldCoverPath = `public/assets/courses/covers/${course.id}.png`
        // try {
        //   await Drive.delete(oldCoverPath)
        // } catch (_) { }

        // Сохраняем новую
        await cover.move('public/assets/courses/covers', {
          name: `${course.id}.png`,
          overwrite: true,
        })
      }

      // 4. Удаляем ВСЕ старые модули с их уроками и заданиями
      // await Module.query({ client: trx })
      //   .where('courseId', course.id)
      //   .delete() // каскадно удалит уроки и задания, если в БД настроен ON DELETE CASCADE
      // Если каскада нет — раскомменти ниже

      // Если в миграциях НЕ настроен cascade delete — раскомменти:

      const moduleIds = await Module.query({ client: trx })
        .where('courseId', course.id)
        .select('id')

      for (const { id } of moduleIds) {
        const lessonIds = await Lesson.query({ client: trx }).where('moduleId', id).select('id')

        for (const { id: lessonId } of lessonIds) {
          await Task.query({ client: trx }).where('lessonId', lessonId).delete()
        }

        await Lesson.query({ client: trx }).where('moduleId', id).delete()
        //await Task.query({ client: trx }).where('moduleId', id).delete() // если по ошибке
      }
      await Module.query({ client: trx }).where('courseId', course.id).delete()
      // await Module.query({ client: trx })
      //   .where('courseId', course.id)
      //   .delete()

      //  // 5. Создаём модули заново — точно так же, как в store()
      for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
        const moduleFromClient = modules[moduleIndex]

        const createdModule = await Module.create(
          {
            courseId: course.id,
            title: moduleFromClient.title,
            description: moduleFromClient.description || null,
            order: moduleIndex,
          },
          { client: trx }
        )

        const lessons = moduleFromClient.lessons || []

        for (let lessonIndex = 0; lessonIndex < lessons.length; lessonIndex++) {
          const lessonFromClient = lessons[lessonIndex]

          const createdLesson = await Lesson.create(
            {
              moduleId: createdModule.id,
              title: lessonFromClient.title,
              description: lessonFromClient.description || null,
              difficultyLevel: lessonFromClient.difficultyLevel || null,
              order: lessonIndex,
            },
            { client: trx }
          )

          const tasks = lessonFromClient.tasks || []

          for (let taskIndex = 0; taskIndex < tasks.length; taskIndex++) {
            const taskFromClient = tasks[taskIndex]

            await Task.create(
              {
                lessonId: createdLesson.id,
                title: taskFromClient.title,
                description: taskFromClient.description || null,
                type: taskFromClient.type,
                order: taskIndex,
                language: taskFromClient.language || "",
                correctOutput: taskFromClient.expectedText || taskFromClient.correctOutput || "",
                startCode: taskFromClient.startCode || "",
              },
              { client: trx }
            )
          }
        }
      }

      await trx.commit()

      return response.ok({
        message: "Course updated successfully",
        courseId: course.id,
      })
    } catch (error) {
      await trx.rollback()
      console.error("Course update failed:", error)
      return response.internalServerError({ error: "Failed to update course" })
    }
  }
  async destroy({ params, response, auth }: HttpContext) {
    const course = await Course.findOrFail(params.id)

    if (!course) {
      return response.notFound()
    }
    const user = auth.user
    if (course.createdBy !== user?.id) {
      return response.unauthorized({ error: "You are not authorized to update this course" });
    }
    const trx = await db.transaction();

    const moduleIds = await Module.query({ client: trx })
      .where('courseId', course.id)
      .select('id')

    for (const { id } of moduleIds) {
      const lessonIds = await Lesson.query({ client: trx }).where('moduleId', id).select('id')

      for (const { id: lessonId } of lessonIds) {
        await Task.query({ client: trx }).where('lessonId', lessonId).delete()
      }

      await Lesson.query({ client: trx }).where('moduleId', id).delete()
      //await Task.query({ client: trx }).where('moduleId', id).delete() // если по ошибке
    }
    await Module.query({ client: trx }).where('courseId', course.id).delete()
    //await Drive.use().delete(`public/course/cover/${fileName}`) <== TODO: Delete images
    await course.delete()
    await trx.commit()

    return response.ok({ message: 'Course deleted' })
  }
}