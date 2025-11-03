import vine from '@vinejs/vine'

export const taskOptionValidator = vine.compile(
  vine.object({
    text: vine.string().trim().minLength(1).maxLength(1000),
    isCorrect: vine.boolean().optional(),
  })
)