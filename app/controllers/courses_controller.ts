import Course from "#models/course/course";
import Lesson from "#models/course/lesson";
import Module from "#models/course/module";
import Task from "#models/task/task";
import TaskOption from "#models/task/task_option";
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
        .if(searchText !== undefined && searchText.trim() !== '', (query) => {
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

    let modules = []
    try {
      modules = typeof data.modules === 'string' ? JSON.parse(data.modules) : data.modules
    } catch (e) {
      return response.badRequest({ error: "Invalid modules format" })
    }

    const course = await Course.create({
      title: data.title,
      description: data.description,
      difficulty: data.difficulty,
      categoryId: Number(data.categoryId),
      createdBy: auth.user!.id
    })


    if (cover) {
      if (!cover.isValid) {
        return response.badRequest({ error: cover.errors })
      }
      await cover.move('public/assets/courses/covers', { name: `${course.id}.png` })
    }


    for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
      const moduleFromClient = modules[moduleIndex]

      const createdModule = await Module.create({
        courseId: course.id,
        title: moduleFromClient.title,
        description: moduleFromClient.description || null,
        order: moduleIndex,
      })

      const lessons = moduleFromClient.lessons || []


      for (let lessonIndex = 0; lessonIndex < lessons.length; lessonIndex++) {
        const lessonFromClient = lessons[lessonIndex]

        const createdLesson = await Lesson.create({
          moduleId: createdModule.id,
          title: lessonFromClient.title,
          description: lessonFromClient.description || null,
          difficultyLevel: lessonFromClient.difficultyLevel || null,
          order: lessonIndex,
        })

        const tasks = lessonFromClient.tasks || []


        for (let taskIndex = 0; taskIndex < tasks.length; taskIndex++) {
          const taskFromClient = tasks[taskIndex]

          const createdTask = await Task.create({
            lessonId: createdLesson.id,
            title: taskFromClient.title,
            description: taskFromClient.description,
            type: taskFromClient.type,
            order: taskIndex,
            language: taskFromClient.language || "",
            correctOutput: taskFromClient.expectedText || taskFromClient.correctOutput || "",
            startCode: taskFromClient.startCode || "",
          })

          const options = taskFromClient.options || []

          if (taskFromClient.type === 'quiz') {
            for (let optionIndex = 0; optionIndex < options.length; optionIndex++) {
              const optionFromClient = options[optionIndex];
              const correctIndex = taskFromClient.correctOption;
              await TaskOption.create({
                taskId: createdTask.id,
                text: optionFromClient,
                isCorrect: optionIndex == correctIndex ? true : false,
                order: optionIndex,
              })
            }
          }
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

      const user = auth.user
      let enrolled = null

      if (user) {
        enrolled = await UserProgress.query()
          .where('user_id', user.id)
          .where('course_id', course.id)
          .preload('course')
          .first()
      }
      
      return response.ok({
        course,
        enrolled,
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

    const data = request.only(['title', 'description', 'difficulty', 'categoryId', 'modules'])
    const cover = request.file('cover')

    let modules: any[] = []
    try {
      modules = typeof data.modules === 'string' ? JSON.parse(data.modules) : data.modules
      if (!Array.isArray(modules)) throw new Error()
    } catch (e) {
      return response.badRequest({ error: "Invalid modules format" })
    }

    const trx = await db.transaction()

    try {
      const course = await Course.find(courseId, { client: trx })
      if (!course) {
        await trx.rollback()
        return response.notFound({ error: "Course not found" })
      }

      const user = auth.user
      if (course.createdBy !== user?.id && user?.role !== 'admin') {
        await trx.rollback()
        return response.unauthorized({ error: "You are not authorized to update this course" })
      }

      course.merge({
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        categoryId: Number(data.categoryId),
      })
      await course.save()

      if (cover) {
        if (!cover.isValid) {
          await trx.rollback()
          return response.badRequest({ error: cover.errors })
        }

        await cover.move('public/assets/courses/covers', {
          name: `${course.id}.png`,
          overwrite: true,
        })
      }


      const incomingModuleIds = modules.filter(m => m.id).map(m => m.id)
      await Module.query({ client: trx })
        .where('courseId', course.id)
        .whereNotIn('id', incomingModuleIds)
        .delete()

      for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex++) {
        const moduleData = modules[moduleIndex]
        let module: Module | null

        module = await Module.find(moduleData.id, { client: trx })
        if (module) {
          module.merge({
            title: moduleData.title,
            description: moduleData.description || null,
            order: moduleIndex,
          })
          await module.save()
        } else {
          module = await Module.create(
            {
              courseId: course.id,
              title: moduleData.title,
              description: moduleData.description || null,
              order: moduleIndex,
            },
            { client: trx }
          )
        }

        const incomingLessonIds = (moduleData.lessons || []).filter((l: Lesson) => l.id).map((l: Lesson) => l.id)

        await Lesson.query({ client: trx })
          .where('moduleId', module.id)
          .whereNotIn('id', incomingLessonIds)
          .delete()

        for (let lessonIndex = 0; lessonIndex < (moduleData.lessons || []).length; lessonIndex++) {
          const lessonData = moduleData.lessons[lessonIndex]
          let lesson: Lesson | null

          lesson = await Lesson.find(lessonData.id, { client: trx })
          if (lesson) {
            lesson.merge({
              title: lessonData.title,
              description: lessonData.description || null,
              difficultyLevel: lessonData.difficultyLevel || null,
              order: lessonIndex,
            })
            await lesson.save()
          } else {
            lesson = await Lesson.create(
              {
                moduleId: module.id,
                title: lessonData.title,
                description: lessonData.description || null,
                difficultyLevel: lessonData.difficultyLevel || null,
                order: lessonIndex,
              },
              { client: trx }
            )
          }

          const incomingTaskIds = (lessonData.tasks || []).filter((t: Task) => t.id).map((t:Task) => t.id)

          await Task.query({ client: trx })
            .where('lessonId', lesson.id)
            .whereNotIn('id', incomingTaskIds)
            .delete()

          for (let taskIndex = 0; taskIndex < (lessonData.tasks || []).length; taskIndex++) {
            const taskData = lessonData.tasks[taskIndex]
            let task: Task | null
            task = await Task.find(taskData.id, { client: trx })
            if (task) {
              task.merge({
                title: taskData.title,
                description: taskData.description || null,
                type: taskData.type,
                order: taskIndex,
                language: taskData.language || "",
                correctOutput: taskData.expectedText ?? taskData.correctOutput ?? "",
                startCode: taskData.startCode || "",
              })
              await task.save()
            } else {
              task = await Task.create(
                {
                  lessonId: lesson.id,
                  title: taskData.title,
                  description: taskData.description || null,
                  type: taskData.type,
                  order: taskIndex,
                  language: taskData.language || "",
                  correctOutput: taskData.expectedText ?? taskData.correctOutput ?? "",
                  startCode: taskData.startCode || "",
                },
                { client: trx }
              )
            }

            if (taskData.type === 'quiz') {
              const incomingOptionIds = (taskData.options || []).filter((o: TaskOption) => o.id).map((o: TaskOption) => o.id)

              await TaskOption.query({ client: trx })
                .where('taskId', task.id)
                .whereNotIn('id', incomingOptionIds)
                .delete()

              for (let optionIndex = 0; optionIndex < (taskData.options || []).length; optionIndex++) {
                const optionData = taskData.options[optionIndex]
                let option: TaskOption | null
                option = await TaskOption.find(optionData.id, { client: trx })

                if (option) {
                  option.merge({
                    text: optionData.text ?? optionData,
                    isCorrect: optionData.isCorrect ?? false,
                    order: optionIndex,
                  })
                  await option.save()
                } else {
                  await TaskOption.create(
                    {
                      taskId: task.id,
                      text: optionData.text ?? optionData,
                      isCorrect: optionIndex === taskData.correctOption,
                      order: optionIndex,
                    },
                    { client: trx }
                  )
                }
              }
            }
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
    }
    await Module.query({ client: trx }).where('courseId', course.id).delete()
    //await Drive.use().delete(`public/course/cover/${fileName}`) <== TODO: Delete images
    await course.delete()
    await trx.commit()

    return response.ok({ message: 'Course deleted' })
  }
}