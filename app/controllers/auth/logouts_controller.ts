// import type { HttpContext } from '@adonisjs/core/http'

import { HttpContext } from "@adonisjs/core/http";

export default class LogoutsController {

    async logout ({response,auth}:HttpContext){
        console.log('logout')
        try{
            await auth.use('web').logout()
            console.log('good')
            return response.status(200)
        }
        catch(err){

        }

    }
}