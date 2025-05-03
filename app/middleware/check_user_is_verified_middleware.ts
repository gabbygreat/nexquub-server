import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { lowerCase, sendError } from '../utils/utils.js'
import { emailValidator } from '#validators/email'
import OtpService from '#services/otp_service'
import { OtpVerificationType } from '#validators/otp'

export default class CheckUserIsVerifiedMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    try {
      await request.validateUsing(emailValidator)
      const { email, password } = request.body()
      // Check if user is verified
      let user: User
      if (password) {
        user = await User.verifyCredential(lowerCase(email), password)
      } else {
        user = await User.findByOrFail('email', email)
      }
      if (user) {
        if (user.verified === false) {
          const result = await OtpService.sendOtp(email, { forceResend: true })
          return sendError(response, {
            message: `Account not verified. Please verify your email to continue.`,
            code: 403,
            data: {
              email: lowerCase(email),
              otpExpiry: result.otpExpiry,
              type: OtpVerificationType.ACCOUNT_CREATION,
            },
          })
        }
      }
    } catch (error) {
      return sendError(response, { error })
    }
    const output = await next()
    return output
  }
}
