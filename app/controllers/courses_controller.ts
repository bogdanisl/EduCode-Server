// import type { HttpContext } from '@adonisjs/core/http'

import Course from "#models/course/course";
import { HttpContext } from "@adonisjs/core/http";

export default class CoursesController {
    public async getLatest({ response }: HttpContext) {
    try {
      const courses = await Course.query()
        .orderBy('created_at', 'desc') 
        .limit(4)

      return response.ok(courses)
    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching latest courses',
        error: error.message,
      })
    }
  }
}