// import type { HttpContext } from '@adonisjs/core/http'

import User from "#models/user/user"
import { HttpContext } from "@adonisjs/core/http"

export default class UsersController {
    async index({ response }: HttpContext) {
        const users = await User.query()
            .select([
                'id',
                'fullName',
                'email',
                'role',
                'lives',
                'isActive',
                'createdAt',
            ])
            .orderBy('createdAt', 'desc')


        if (!users) return response.noContent();
        return response.ok(users);
    }
    async update({ params, request, response }: HttpContext) {
        const user = await User.find(params.id)

        if (!user) {
            return response.notFound({ message: 'User not found' })
        }

        const data = request.only([
            'fullName',
            'email',
            'role',
            'lives',
            'isActive',
        ])

        user.merge(data)
        await user.save()

        return response.ok(user)
    }
    async show({ params, response }: HttpContext) {
        const user = await User.find(params.id)

        if (!user) {
            return response.notFound({ message: 'User not found' })
        }

        return response.ok(user)
    }
    async destroy({ params, response }: HttpContext) {
        const user = await User.find(params.id)

        if (!user) {
            return response.notFound({ message: 'User not found' })
        }

        await user.delete()

        return response.ok({ message: 'User deleted successfully' })
    }
}