import vine, { SimpleMessagesProvider } from '@vinejs/vine'

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email(),
    password: vine.string().trim(),
  })
)

loginValidator.messagesProvider = new SimpleMessagesProvider({
  'email.email': 'A valid email address is required',
})
