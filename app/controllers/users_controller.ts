import User from '#models/user'
import { otherSourcesLoginValidator, registrationValidator } from '#validators/register'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { lowerCase, sendError, sendSuccess } from '../utils/utils.js'
import LocalizationService from '#services/localization_service'
import { loginValidator } from '#validators/login'
import LoginService from '#services/login_service'
import UserResponseDTO from '../response/user_response.js'
import { RegisterSourceHelper } from '#utils/enums'
import OtpService from '#services/otp_service'
import { otpValidator, OtpVerificationType } from '#validators/otp'
import { resetPasswordValidator } from '#validators/reset_password'
import { emailValidator } from '#validators/email'

@inject()
export default class UsersController {
  constructor(protected loginService: LoginService) {}
  async register({ request, response }: HttpContext) {
    try {
      await request.validateUsing(registrationValidator)
      const { email, password, firstName, lastName } = request.body()
      const user = await User.create({ email: lowerCase(email), password, firstName, lastName })
      await User.accessTokens.create(user, [], { expiresIn: '100 days' })
      const result = await OtpService.sendOtp(email)
      return sendSuccess(response, {
        message: LocalizationService.getMessage(request.lang, 'check_email', { email }),
        data: { otp: result.otp, otpExpiry: result.otpExpiry },
        code: 201,
      })
    } catch (error) {
      return sendError(response, { error })
    }
  }

  async login({ request, response }: HttpContext) {
    try {
      await request.validateUsing(loginValidator)
      const { email, password } = request.body()
      const user = await User.verifyCredentials(lowerCase(email), password)
      if (!user.verified) {
        const result = await OtpService.sendOtp(email)
        return sendError(response, {
          message: `Account not verified. Please verify your email to continue. ${result.otp}`,
          code: 403,
          data: { otpExpiry: result.otpExpiry },
        })
      }
      const token = await User.accessTokens.create(user, [], { expiresIn: '100 days' })
      const userDTO: UserResponseDTO = {
        user: user,
        token,
      }
      return sendSuccess(response, {
        message: LocalizationService.getMessage(request.lang, 'login_success'),
        data: userDTO,
      })
    } catch (error) {
      return sendError(response, { error })
    }
  }

  async loginOtherSource({ request, response }: HttpContext) {
    try {
      await request.validateUsing(otherSourcesLoginValidator)
      const { accessToken, source } = request.body()
      let user: User
      const registerSource = RegisterSourceHelper.fromSource(source)
      user = await this.loginService.socialLogin(registerSource, accessToken)
      const token = await User.accessTokens.create(user, [], { expiresIn: '100 days' })
      const userDTO: UserResponseDTO = {
        user: user,
        token,
      }
      return sendSuccess(response, {
        message: LocalizationService.getMessage(request.lang, 'login_success'),
        data: userDTO,
      })
    } catch (error) {
      return sendError(response, { code: 500, error: error })
    }
  }

  public async requestOtp({ request, response }: HttpContext) {
    const { email } = request.body()

    const result = await OtpService.sendOtp(email)

    if (!result.success) {
      return sendError(response, { message: result.message })
    }

    return sendSuccess(response, {
      message: result.message,
      data: { otp: result.otp, otpExpiry: result.otpExpiry },
    })
  }

  public async verifyOtp({ request, response }: HttpContext) {
    try {
      await request.validateUsing(otpValidator)
      const { email, verificationCode, type } = request.body()

      const typesRequiringOtpDeletion = [OtpVerificationType.ACCOUNT_CREATION]

      const deleteOtp = typesRequiringOtpDeletion.includes(type)
      const result = await OtpService.verifyOtp(email, verificationCode, deleteOtp)
      if (!result.success) {
        return sendError(response, { message: result.message })
      }
      switch (type) {
        case OtpVerificationType.ACCOUNT_CREATION: {
          const user = await User.findByOrFail('email', email)
          user.verified = true
          await user.save()
          const token = await User.accessTokens.create(user, [], { expiresIn: '100 days' })
          const userDTO: UserResponseDTO = {
            user,
            token,
          }
          return sendSuccess(response, {
            message: result.message,
            data: userDTO,
          })
        }
        case OtpVerificationType.FORGOT_PASSWORD:
          return sendSuccess(response, { message: result.message })
      }
    } catch (error) {
      return sendError(response, { error: error })
    }
  }

  public async forgotPassword({ request, response }: HttpContext) {
    try {
      await request.validateUsing(emailValidator)
      const { email } = request.body()
      const result = await OtpService.sendOtp(email, 600)
      if (!result.success) {
        return sendError(response, { message: result.message })
      }
      return sendSuccess(response, {
        message: LocalizationService.getMessage(request.lang, 'check_email', { email }),
        data: { otp: result.otp, otpExpiry: result.otpExpiry },
      })
    } catch (error) {
      return sendError(response, { error })
    }
  }

  public async resetPassword({ request, response }: HttpContext) {
    try {
      await request.validateUsing(resetPasswordValidator)
      const { email, verificationCode, newPassword } = request.body()
      const result = await OtpService.verifyOtp(email, verificationCode)

      if (!result.success) {
        return sendError(response, { message: result.message })
      }

      const user = await User.findByOrFail('email', email)
      user.password = newPassword
      await user.save()

      return sendSuccess(response, {
        message: 'Password has been reset successfully.',
      })
    } catch (error) {
      return sendError(response, { error })
    }
  }
}
