import { RegisterSource } from '#models/user'
import vine, { SimpleMessagesProvider } from '@vinejs/vine'

export const registrationValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email(),
    password: vine.string().trim().minLength(6),
  })
)

export const googleLoginValidator = vine.compile(
  vine.object({
    access_token: vine.string(),
    source: vine.enum(Object.values(RegisterSource)),
  })
)

registrationValidator.messagesProvider = new SimpleMessagesProvider({
  'email.email': 'A valid email address is required',
  'password.minLength': 'Password must be at least 6 characters long',
})

googleLoginValidator.messagesProvider = new SimpleMessagesProvider({
  'access_token.required': 'Access Token is required',
  'source.required': 'Invalid source selected',
})
