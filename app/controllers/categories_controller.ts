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

    public async store({ response, request }: HttpContext) {
        try {
            const data = request.only(['title', 'description']);
            console.log(data);
            if (!data || !data.title || !data.description) {
                return response.badRequest({ error: "Fields cannot be empty" });
            }
            const category = await CourseCategory.create({
                name: data.title,
                description: data.description,
            })
            if (!category) {
                return response.badGateway();
            }
            return response.created(category);
        }
        catch (err) {
            return response.badGateway();
        }
    }
}