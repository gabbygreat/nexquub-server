import vine, { SimpleMessagesProvider } from '@vinejs/vine'

export const resetPasswordValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email(),
    verificationCode: vine.string().trim().minLength(4).maxLength(6),
    newPassword: vine.string().trim().minLength(6),
  })
)

resetPasswordValidator.messagesProvider = new SimpleMessagesProvider({
  'email.required': 'Email is required',
  'email.email': 'Enter a valid email address',
  'verificationCode.required': 'Verification code is required',
  'verificationCode.minLength': 'OTP must be at least 4 characters',
  'verificationCode.maxLength': 'OTP must not exceed 6 characters',
  'newPassword.required': 'New password is required',
  'newPassword.minLength': 'Password must be at least 6 characters long',
})
