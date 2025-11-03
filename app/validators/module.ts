import vine from '@vinejs/vine'

export const moduleValidator = vine.compile(
  vine.object({
    title: vine.string().trim().minLength(3).maxLength(255),
    description: vine.string().nullable(),
  })
)