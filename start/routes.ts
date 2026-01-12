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
import PasswordResetController from '#controllers/auth/password_reset_conrollers_controller'
import CoursesController from '#controllers/courses_controller'
import CategoriesController from '#controllers/categories_controller'
// import ModulesController from '#controllers/modules_controller'
import LessonsController from '#controllers/lessons_controller'
import TasksController from '#controllers/tasks_controller'
//import TaskOptionsController from '#controllers/task_options_controller'
import UserProgressController from '#controllers/user_progress_controller'
import UsersController from '#controllers/users_controller'

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router.post('/api/test', async () => {
  return {
    text: "hello from EduCode API. Story begins here :)"
  }
})


//auth
router.group(() => {
  router.post('register', [RegistersController, 'register']).as('auth.register')
  router.post('login', [LoginController, 'login']).as('auth.login')
  router.post('/reset/request', [PasswordResetController, 'request']).as('reset.request')
  router.post('/reset/verify', [PasswordResetController, 'verify']).as('reset.verify')
  router.post('/reset/complete', [PasswordResetController, 'complete']).as('reset.compete')
}
).prefix('/api/v1/auth')

router.group(() => {
  router.post('logout', [LogoutsController, 'logout']).as('auth.logout')
  router.get('me', [LoginController, 'me']).as('auth.me')
}).prefix('/api/v1/auth').use(middleware.auth({ guards: ['web'] }))

//Courses
router.group(() => {
  router.get('/course', [CoursesController, 'index']).as('course.index')
  router.get('/course/:id', [CoursesController, 'show']).as('course.show').use(middleware.auth({ optional: true }))
  router.post('/course', [CoursesController, 'store']).as('course.store').use(middleware.autorAuth())
  router.patch('/course/:id', [CoursesController, 'update']).as('course.update').use(middleware.autorAuth())
  router.delete('/course/:id', [CoursesController, 'destroy']).as('course.delete').use(middleware.autorAuth())
}).prefix('/api')

//Categories
router.group(() => {
  router.get('/category/list', [CategoriesController, 'get']).as('categories.list')
  router.post('/category', [CategoriesController, 'store']).as('categories.store')
}).prefix('/api/courses')

//Lessons
router.get('/api/lesson/:id', [LessonsController, 'show']).as('lesson.show')

//Tasks
router.post('/api/task/:id/check', [TasksController, 'check']).as('task.check').use(middleware.auth({ guards: ['web'] }))


//User Progress
router.group(() => {
  router.post('/enroll/:courseId', [UserProgressController, 'enroll']).as('user_progress.enroll')
  router.get('/progress', [UserProgressController, 'index']).as('user_progress.index')
}).prefix('/api').use(middleware.auth({ guards: ['web'] }))


// Users (Admin access only)
router.group(() => {
  router.get('/users', [UsersController, 'index']).as('users.index');
  router.get('/users/:id', [UsersController, 'show']).as('users.show');
  router.put('/users/:id', [UsersController, 'update']).as('users.update');
  router.delete('/users/:id', [UsersController, 'destroy']).as('user.delete');
}).prefix('/api').use(middleware.adminAuth());