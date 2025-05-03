import vine, { SimpleMessagesProvider } from '@vinejs/vine'

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email(),
    password: vine.string().trim(),
    messagingToken: vine.string().nullable().optional(),
  })
)
export const tokenLoginValidator = vine.compile(
  vine.object({
    messagingToken: vine.string().nullable().optional(),
  })
)

loginValidator.messagesProvider = new SimpleMessagesProvider({
  'email.email': 'A valid email address is required',
})
