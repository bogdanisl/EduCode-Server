import Article from "#models/article"
import { HttpContext } from "@adonisjs/core/http"

export default class ArticlesController {


    public async store({ request, response }: HttpContext) {
        const { title, subtitle, content } = request.all()
        const cover = request.file('cover')

        // --- Validation ---
        if (!title || title.trim() === '') {
            return response.status(400).json({
                code: 'INVALID_TITLE',
                message: 'Title is required',
            })
        }

        if (!content || content.trim() === '') {
            return response.status(400).json({
                code: 'INVALID_CONTENT',
                message: 'Content is required',
            })
        }

        if (cover && !cover.isValid) {
            return response.status(400).json({
                code: 'INVALID_FILE',
                message: cover.errors,
            })
        }

        const article = await Article.create({
            title: title.trim(),
            subtitle: subtitle?.trim() || null,
            content: content.trim(),
        })

        if (cover) {
            await cover.move('public/assets/articles', {
                name: `${article.id}.png`,
                overwrite: true,
            })
        }

        return response.status(201).json({
            code: 'SUCCESS',
            message: 'Article created successfully',
            article
        })
    }
    public async index({ response }: HttpContext) {
        try {
            const articles = await Article.query()
                .orderBy('createdAt', 'desc')

            const result = articles.map((article) => ({
                id: article.id,
                title: article.title,
                subtitle: article.subtitle,
                content: article.content,
                createdAt: article.createdAt,
                updatedAt: article.updatedAt,
                coverUrl: `public/assets/articles/${article.id}`,
            }))

            return response.ok({
                code: 'SUCCESS',
                message: 'Articles fetched successfully',
                articles: result,
            })
        } catch (error) {
            return response.internalServerError({
                code: 'FETCH_ERROR',
                message: 'Failed to fetch articles',
                error: error.message,
            })
        }
    }
    public async show({ params, response }: HttpContext) {
        try {
            const article = await Article.find(params.id)

            if (!article) {
                return response.status(404).json({
                    code: 'ARTICLE_NOT_FOUND',
                    message: 'Article not found',
                })
            }

            return response.ok({
                code: 'SUCCESS',
                message: 'Article fetched successfully',
                article: {
                    id: article.id,
                    title: article.title,
                    subtitle: article.subtitle,
                    content: article.content,
                    createdAt: article.createdAt,
                    updatedAt: article.updatedAt,
                },
            })
        } catch (error) {
            return response.internalServerError({
                code: 'FETCH_ERROR',
                message: 'Failed to fetch article',
                error: error.message,
            })
        }
    }
    public async destroy({ params, response }: HttpContext) {
        try {
            const article = await Article.find(params.id)

            if (!article) {
                return response.status(404).json({
                    code: 'ARTICLE_NOT_FOUND',
                    message: 'Article not found',
                })
            }

            // Удаляем файл изображения, если он существует
            //const coverPath = `public/assets/articles/${article.id}_*` // если нужно точное имя, хранить его в колонке
            try {
                //await Drive.delete(coverPath)
            } catch (_) {
            }

            await article.delete()

            return response.ok({
                code: 'SUCCESS',
                message: 'Article deleted successfully',
            })
        } catch (error) {
            return response.internalServerError({
                code: 'DELETE_ERROR',
                message: 'Failed to delete article',
                error: error.message,
            })
        }
    }
}
