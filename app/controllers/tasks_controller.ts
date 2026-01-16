import Lesson from '#models/course/lesson'
import Module from '#models/course/module'
import Task from '#models/task/task'
import UserProgress from '#models/user/user_progress'
import CloudCodeRunnerService from '#services/code-runner.service'
import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'

const runner = new CloudCodeRunnerService()

export default class TasksController {


  async check({ auth, params, request, response }: HttpContext) {
    const taskId = Number(params.id)
    const task = await Task.query().where('id', taskId).preload('options').firstOrFail()

    let isCorrect = false
    let extra: any = {}

    switch (task.type) {
      case 'quiz': {
        const { selectedOptionId } = await this.validateQuiz(request)
        await task.load('options')
        const option = task.options.find((opt) => opt.id === selectedOptionId)
        isCorrect = option?.isCorrect == true
        break
      }

      case 'text': {
        const { answer } = await this.validateText(request)
        const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
        isCorrect = normalize(task.correctOutput || '') === normalize(answer)
        break
      }

      case 'code': {

        const { code } = await this.validateCode(request)

        const result = await runner.execute(code, 63)

        const expected = (task.correctOutput || '').trim()
        const received = result.output.trim()


        isCorrect = result.success && received === expected
        extra = {
          output: result.output,
          console: result.console,
          error: result.error,
        }

        break
      }

      default:
        return response.badRequest({ message: 'Unknown task type' })
    }

    let nextLessonId = -1;

    if (isCorrect) {
      const lesson = await Lesson.findOrFail(task.lessonId);
      const tasks = await Task.query().where('lessonId', lesson.id);
      if (tasks.length - 1 == task.order) {

        const lessons = await Lesson.query().where('moduleId', lesson.moduleId);
        const module = await Module.query().where('id', lesson.moduleId).firstOrFail();

        const user = auth.user!;
        const progress = await UserProgress.query().where('userId', user.id).where('courseId', module.courseId).first();


        if (lessons.length - 1 == lesson.order) {
          if (module) { // load first lesson of next module
            const modules = await Module.query().where('courseId', module.courseId);
            const nextModule = modules.find(m => m.order == module.order + 1);
            if (progress) {

              if (nextModule) {
                const nextLesson = await Lesson.query().where('moduleId', nextModule.id).where('order', 0).first();
                if (nextLesson) {
                  nextLessonId = nextLesson.id;
                  progress.completedLessonsCount += 1;
                }
              }
              else { // no next module means course completed
                progress.isCompleted = true;
                nextLessonId = -2;
                progress.completedLessonsCount += 1;
              }
              await progress.save();
            }
          }
        }
        else { // load next lesson of this module
          if (module) {
            if (progress) {
              const nextLesson = await Lesson.query().where('moduleId', module.id).where('order', lesson.order + 1).first();
              if (nextLesson) {
                nextLessonId = nextLesson.id;
                progress.lessonId = nextLessonId;
                progress.completedLessonsCount += 1;
              }
              else { // no next lesson means course completed
                progress.isCompleted = true;
                nextLessonId = -2;
                progress.completedLessonsCount += 1;
              }
              await progress.save();
            }
          }
        }
      }
      else {

      }
    }
    return response.json({
      correct: isCorrect,
      ...extra,
      nextLessonId
    })
  }

  private async validateQuiz(request: HttpContext['request']) {
    const schema = vine.object({ selectedOptionId: vine.number() })
    const validator = vine.compile(schema)
    return validator.validate(request.body())
  }

  private async validateText(request: HttpContext['request']) {
    const schema = vine.object({ answer: vine.string().trim() })
    const validator = vine.compile(schema)
    return validator.validate(request.body())
  }

  private async validateCode(request: HttpContext['request']) {
    const schema = vine.object({ code: vine.string() })
    const validator = vine.compile(schema)
    return validator.validate(request.body())
  }

}