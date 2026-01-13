import User from "#models/user/user";
import { HttpContext } from "@adonisjs/core/http";

export default class RegistersController {
 public async register({ request, response, auth }: HttpContext) {
    const { fullName, email, password } = request.all()

    // --- Validation ---
    if (!fullName || fullName.length > 40) {
      return response.status(400).json({
        code: 'INVALID_FULLNAME',
        message: 'Full name is required and max 40 characters',
      })
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      return response.status(400).json({
        code: 'INVALID_EMAIL',
        message: 'Invalid email format',
      })
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    if (!password || !passwordRegex.test(password)) {
      return response.status(400).json({
        code: 'INVALID_PASSWORD',
        message:
          'Password must be at least 8 characters and include 1 uppercase, 1 lowercase, 1 number',
      })
    }

    // --- Check email uniqueness ---
    const existingUser = await User.query().where('email', email).first()
    if (existingUser) {
      return response.status(400).json({
        code: 'EMAIL_EXISTS',
        message: 'Email is already registered',
      })
    }

    // --- Create user ---

    const user = await User.create({
      fullName,
      email,
      password,
    })

    await auth.use('web').login(user)

    return response.status(201).json({
      code: 'SUCCESS',
      message: 'User registered successfully',
      user: { id: user.id, fullName: user.fullName, email: user.email,role:user.role,lives:user.lives,lives_reset_at:user.livesResetAt },
    })
  }
    
}