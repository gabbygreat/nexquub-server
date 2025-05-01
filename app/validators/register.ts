import { RegisterSource } from '#utils/enums'
import vine, { SimpleMessagesProvider } from '@vinejs/vine'

export const registrationValidator = vine.compile(
  vine.object({
    firstName: vine.string().trim().minLength(2),
    lastName: vine.string().trim().minLength(2),
    email: vine.string().trim().email(),
    password: vine.string().trim().minLength(6),
    confirmPassword: vine.string().confirmed({
      confirmationField: 'password',
    }),
  })
)

export const otherSourcesLoginValidator = vine.compile(
  vine.object({
    accessToken: vine.string(),
    source: vine.enum(Object.values(RegisterSource)),
  })
)

registrationValidator.messagesProvider = new SimpleMessagesProvider({
  'email.email': 'A valid email address is required',
  'password.minLength': 'Password must be at least 6 characters long',
})

otherSourcesLoginValidator.messagesProvider = new SimpleMessagesProvider({
  'accessToken.required': 'Access Token is required',
  'source.required': 'Invalid source selected',
})
