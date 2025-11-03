import vine from '@vinejs/vine'

export const taskValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(3).maxLength(255),
    description: vine.string().minLength(10),
    type: vine.enum(['quiz', 'code', 'text']),
    options: vine
      .array(
        vine.object({
          text: vine.string().minLength(1),
          isCorrect: vine.boolean().optional(),
        })
      )
      .optional(),
  })
)