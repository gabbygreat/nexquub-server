import vine, { SimpleMessagesProvider } from '@vinejs/vine'

export enum OtpVerificationType {
  ACCOUNT_CREATION = 'accountCreation',
  FORGOT_PASSWORD = 'forgotPassword',
}


export const otpValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email(),
    verificationCode: vine
      .string()
      .trim()
      .regex(/^\d{4}$/),
    type: vine.enum(Object.values(OtpVerificationType)),
  })
)
export const requestOTPValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email(),
    type: vine.enum(Object.values(OtpVerificationType)),
  })
)

otpValidator.messagesProvider = new SimpleMessagesProvider({
  'email.required': 'Email is required',
  'email.email': 'A valid email address is required',
  'verificationCode.required': 'OTP is required',
  'verificationCode.regex': 'OTP must be exactly 4 digits',
  'type.required': 'OTP type is required',
})
