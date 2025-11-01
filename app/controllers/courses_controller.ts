// import type { HttpContext } from '@adonisjs/core/http'

import Course from "#models/course/course";
import { HttpContext } from "@adonisjs/core/http";

export default class CoursesController {
  async index({ response, request }: HttpContext) {
    const limit = Number(request.qs().limit) || 10
    const offset = Number(request.qs().offset) || 0
    try {
      const courses = await Course.query()
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
  async show({ response, params }: HttpContext) {
    const id = params.id
    try {
      const course = await Course.query()
        .where('id', id)
        .preload('category')
        .first()
      console.log({ course })
      if (!course) {
        return response.notFound()
      }
      else {
        return response.ok({ course })
      }
    } catch (error) {
      console.error(error.message)
      return response.internalServerError({
        message: 'Error fetching course with id: ' + id,
        error: error.message,
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

    if(!course){
      return response.notFound()
    }
    //await Drive.use().delete(`public/course/cover/${fileName}`) <== TODO: Delete images
    await course.delete()
    return response.ok({ message: 'Course deleted' })
  }
}