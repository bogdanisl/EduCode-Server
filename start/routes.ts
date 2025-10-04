/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import LoginController from '#controllers/auth/login_controller'
import LogoutsController from '#controllers/auth/logouts_controller'
import RegistersController from '#controllers/auth/registers_controller'
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router.post('/api/test', async ()=>{
  return{
    text: "hello from EduCode API. Story begins here :)"
  }
})

router.group(()=>
  {
    router.post('register',[RegistersController,'register']).as('auth.register')
    router.post('login',[LoginController,'login']).as('auth.login')
  }
).prefix('/api/v1/auth')

router.group(()=>{

    router.post('logout',[LogoutsController,'logout']).as('auth.logout')
    router.get('me',[LoginController,'me']).as('auth.me')
}).prefix('/api/v1/auth').use(middleware.auth({guards: ['web']}))
