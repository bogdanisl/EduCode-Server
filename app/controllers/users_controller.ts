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

    async userUpdate({ params, request, response, auth }: HttpContext) {
        const authUser = auth.user!

        // --- Access control ---
        if (authUser.id !== Number(params.id)) {
            return response.status(403).json({
                code: 'FORBIDDEN',
                message: 'You cannot edit another user profile',
            })
        }

        const user = await User.find(params.id)

        if (!user) {
            return response.status(404).json({
                code: 'USER_NOT_FOUND',
                message: 'User not found',
            })
        }

        const { fullName, email } = request.only([
            'fullName',
            'email',
        ])

        // --- Validation ---
        if (fullName !== undefined) {
            if (!fullName || fullName.length > 40) {
                return response.status(400).json({
                    code: 'INVALID_FULLNAME',
                    message: 'Full name is required and max 40 characters',
                })
            }
        }

        if (email !== undefined) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

            if (!emailRegex.test(email)) {
                return response.status(400).json({
                    code: 'INVALID_EMAIL',
                    message: 'Invalid email format',
                })
            }

            const emailExists = await User.query()
                .where('email', email)
                .whereNot('id', user.id)
                .first()

            if (emailExists) {
                return response.status(400).json({
                    code: 'EMAIL_EXISTS',
                    message: 'Email is already registered',
                })
            }
        }

        // --- Update ---
        user.merge({
            ...(fullName !== undefined && { fullName }),
            ...(email !== undefined && { email }),
        })

        await user.save()

        return response.ok({
            code: 'SUCCESS',
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                lives: user.lives,  
                lives_reset_at: user.livesResetAt,
            },
        })
    }

    async changePassword({ auth, request, response }: HttpContext) {
        const user = auth.user!

        const { currentPassword, newPassword } = request.only([
            'currentPassword',
            'newPassword',
        ])

        // --- Validation ---
        if (!currentPassword || !newPassword) {
            return response.status(400).json({
                code: 'MISSING_FIELDS',
                message: 'Current password and new password are required',
            })
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
        if (!passwordRegex.test(newPassword)) {
            return response.status(400).json({
                code: 'INVALID_PASSWORD',
                message:
                    'Password must be at least 8 characters and include 1 uppercase, 1 lowercase, 1 number',
            })
        }

        if (currentPassword === newPassword) {
            return response.status(400).json({
                code: 'SAME_PASSWORD',
                message: 'New password must be different from the current one',
            })
        }

        // --- Check current password ---
        const isValid = await user.verifyPassword(currentPassword)
        if (!isValid) {
            return response.status(400).json({
                code: 'INVALID_CURRENT_PASSWORD',
                message: 'Current password is incorrect',
            })
        }

        // --- Update password ---
        user.password = newPassword
        await user.save()

        return response.ok({
            code: 'SUCCESS',
            message: 'Password changed successfully',
        })
    }


}