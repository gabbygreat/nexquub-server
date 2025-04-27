import vine, { SimpleMessagesProvider } from '@vinejs/vine'

export const emailValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email(),
  })
)

emailValidator.messagesProvider = new SimpleMessagesProvider({
  'email.email': 'A valid email address is required',
  'email.required': 'Email is required',
})
