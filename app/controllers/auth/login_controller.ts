// import type { HttpContext } from '@adonisjs/core/http'

import User from "#models/user";
import { HttpContext } from "@adonisjs/core/http";

export default class LoginController {

    public async login({ request, response, auth }: HttpContext) {
    const { email, password } = request.all();
    
    // --- Validation ---
    if (!email) {
        return response.status(400).json({
            code: 'EMAIL_REQUIRED',
            message: 'Email is required',
        });
    }

    const email_exist = await User.query().where('email',email).first()
    if(!email_exist){
         return response.status(400).json({
            code: 'USER_NOT_FOUND',
            message: 'User not found',
        });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return response.status(400).json({
            code: 'INVALID_EMAIL',
            message: 'Invalid email format',
        });
    }
    
    if (!password) {
        return response.status(400).json({
            code: 'PASSWORD_REQUIRED',
            message: 'Password is required',
      });
    }

try {
      // --- Verify credentials (Adonis handles hashed password) ---
      
      const user = await User.verifyCredentials(email, password);

      // --- Login user into session ---
      await auth.use('web').login(user)


      return response.status(200).json({
        code: "SUCCESS",
        message: "Login successful",
        user: { id: user.id, fullName: user.fullName, email: user.email },
      });
    } catch (error) {
      return response.status(400).json({
        code: "INVALID_PASSWORD",
        message: "Invalid password",
      });
    }
    }

    public async me({ auth, response }: HttpContext) {
    try {
      
      if(auth.user){
        return {
          user: auth.user
        }
      }
      else{
        return response.unauthorized({messages: "Unauthorized"})
      }
    } catch(err) {
      return response.status(401).json({ message: "Not authorized. Server Error" });
    }
  }
}