import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AutorAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    
    await ctx.auth.authenticateUsing()
    
    const user = ctx.auth.user
    
    if((user?.role === 'tester' || user?.role === 'admin') && user){
      const output = await next()
      return output
    }
    else{
      return ctx.response.status(401)
    }
  }
}