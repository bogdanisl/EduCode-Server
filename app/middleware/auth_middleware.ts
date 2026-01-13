import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
  redirectTo = '/login'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
      optional?: boolean
    } = {}
  ) {
    const { optional = false, guards = ['web'] } = options

    if (optional) {
      try {
        await ctx.auth.authenticateUsing(guards)
      } catch (error) {
        // Skip if auth is optional
      }
    } else {
      await ctx.auth.authenticateUsing(guards, { loginRoute: this.redirectTo })
    }

    return next()
  }
}