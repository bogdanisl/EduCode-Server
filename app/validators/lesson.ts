import vine from '@vinejs/vine'

export const lessonValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(3).maxLength(255),
    description: vine.string().nullable(),
    difficultyLevel: vine.enum(['beginner', 'intermediate', 'advanced']).optional(),
  })
)