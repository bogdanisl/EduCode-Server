// app/controllers/auth/password_reset_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import PasswordResetToken from '#models/user/password_reset_token'
import User from '#models/user/user'
import { DateTime } from 'luxon'
import { randomInt } from 'crypto'

export default class PasswordResetController {
  /**
   * 1️⃣ Request reset — send email with code
   */
  async request({ request, response }: HttpContext) {
    const email = request.input('email')
    const user = await User.findBy('email', email)

    if (!user) {
      return response.badRequest({
        code: 'USER_NOT_FOUND',
        message: 'User with this email does not exist.',
      })
    }

    // Generate 6-digit code
    const code = String(randomInt(100000, 999999))
    const expiresAt = DateTime.now().plus({ minutes: 10 })

    // Delete old tokens for this email
    await PasswordResetToken.query().where('email', email).delete()

    // Save new one
    await PasswordResetToken.create({ email, token: code, expiresAt })

    // Send email
    // await mail.send((message) => {
    //   message
    //     .to(email)
    //     .subject('Password Reset Code')
    //     .htmlView('emails/reset_code', { code })
    // })
    
    console.log('Verefication Code: ' + code)

    return { message: 'Reset code sent to your email.' }
  }

  /**
   * 2️⃣ Verify reset code
   */
  async verify({ request, response }: HttpContext) {
    const { email, code } = request.only(['email', 'code'])
    const record = await PasswordResetToken.query()
      .where('email', email)
      .andWhere('token', code)
      .first()

    if (!record) {
      return response.badRequest({
        code: 'INVALID_CODE',
        message: 'Invalid or expired verification code.',
      })
    }

    if (record.expiresAt < DateTime.now()) {
      await record.delete()
      return response.badRequest({
        code: 'EXPIRED_CODE',
        message: 'Verification code has expired.',
      })
    }

    return { message: 'Code verified successfully.' }
  }

  /**
   * 3️⃣ Complete password reset
   */
  async complete({ request, response, auth }: HttpContext) {
    const { email, code, password } = request.only(['email', 'code', 'password'])

    const record = await PasswordResetToken.query()
      .where('email', email)
      .andWhere('token', code)
      .first()

    if (!record || record.expiresAt < DateTime.now()) {
      return response.badRequest({
        code: 'INVALID_CODE',
        message: 'Invalid or expired code.',
      })
    }

    const user = await User.findByOrFail('email', email)
    user.password = await password
    await user.save()
    await record.delete()

    // Auto-login
    await auth.use('web').login(user)

    return { message: 'Password changed and user logged in.', user }
  }
}
