// import type { HttpContext } from '@adonisjs/core/http'

import CourseCategory from "#models/course/course_category"
import { HttpContext } from "@adonisjs/core/http"

export default class CategoriesController {
    public async get({ response, request }: HttpContext) {
        try {
            const limit = Number(request.qs().limit) || 10
            const offset = Number(request.qs().offset) || 0
            const categories = await CourseCategory.query()
                .orderBy('name', 'desc').offset(offset ?? 0).limit(limit ?? 10)

            if (categories.length === 0) {
                return response.noContent()
            }
            return response.ok({ categories })
        } catch (error) {
            return response.internalServerError({
                message: 'Error fetching categories',
                error: error.message,
            })
        }
    }
}