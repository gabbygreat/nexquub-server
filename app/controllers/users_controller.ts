import User from '#models/user'
import { otherSourcesLoginValidator, registrationValidator } from '#validators/register'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { lowerCase, sendError, sendSuccess } from '../utils/utils.js'
import LocalizationService from '#services/localization_service'
import { loginValidator, tokenLoginValidator } from '#validators/login'
import LoginService from '#services/login_service'
import UserResponseDTO from '../response/user_response.js'
import { RegisterSourceHelper } from '#utils/enums'
import OtpService from '#services/otp_service'
import { otpValidator, OtpVerificationType, requestOTPValidator } from '#validators/otp'
import { resetPasswordValidator } from '#validators/reset_password'
import { emailValidator } from '#validators/email'
import OTPResponseDTO from '../response/otp_response.js'

@inject()
export default class UsersController {
  constructor(protected loginService: LoginService) {}
  async register({ request, response }: HttpContext) {
    try {
      await request.validateUsing(registrationValidator)
      const { email, password, firstName, lastName, messagingToken } = request.body()
      const user = await User.create({ email: lowerCase(email), password, firstName, lastName })
      if (messagingToken) {
        await user.related('messagingTokens').create({
          token: messagingToken,
        })
      }
      await User.accessTokens.create(user)
      const result = await OtpService.sendOtp(email)

      const otpResponse: OTPResponseDTO = {
        email: lowerCase(email),
        otp: result.otp!,
        otpExpiry: result.otpExpiry!,
        type: OtpVerificationType.ACCOUNT_CREATION,
      }
      return sendSuccess(response, {
        message: LocalizationService.getMessage(request.lang, 'check_email', { email }),
        data: otpResponse,
        code: 201,
      })
    } catch (error) {
      return sendError(response, { error })
    }
  }

  async login({ request, response }: HttpContext) {
    try {
      await request.validateUsing(loginValidator)
      const { email, password, messagingToken } = request.body()
      const user = await User.verifyCredential(lowerCase(email), password)
      if (messagingToken) {
        await user.related('messagingTokens').create({
          token: messagingToken,
        })
      }
      const restored = await user.restoreIfNotExpired()
      if (!restored) {
        return sendError(response, {
          message: 'Account permanently deleted, please, create a new account',
          code: 401,
        })
      }
      const token = await User.accessTokens.create(user)
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
      const { accessToken, source, messagingToken } = request.body()
      let user: User
      const registerSource = RegisterSourceHelper.fromSource(source)
      user = await this.loginService.socialLogin(registerSource, accessToken)
      if (messagingToken) {
        await user.related('messagingTokens').create({
          token: messagingToken,
        })
      }
      const restored = await user.restoreIfNotExpired()
      if (!restored) {
        return sendError(response, {
          message: 'Account permanently deleted, please, create a new account',
          code: 401,
        })
      }
      const token = await User.accessTokens.create(user)
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

  async tokenLogin({ auth, request, response }: HttpContext) {
    try {
      await request.validateUsing(tokenLoginValidator)
      const user = auth.user
      if (!user) {
        return sendError(response, { message: 'Invalid user' })
      }
      const { messagingToken } = request.body()
      if (messagingToken) {
        await user.related('messagingTokens').create({
          token: messagingToken,
        })
      }
      const restored = await user.restoreIfNotExpired()
      if (!restored) {
        return sendError(response, {
          message: 'Account permanently deleted, please, create a new account',
          code: 401,
        })
      }
      const token = await User.accessTokens.create(user)
      const userDTO: UserResponseDTO = {
        user,
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

  public async requestOtp({ request, response }: HttpContext) {
    await request.validateUsing(requestOTPValidator)
    const { email, type } = request.body()

    const result = await OtpService.sendOtp(email)

    if (!result.success) {
      return sendError(response, { message: result.message })
    }

    const otpResponse: OTPResponseDTO = {
      email: lowerCase(email),
      otp: result.otp!,
      otpExpiry: result.otpExpiry!,
      type: type,
    }
    return sendSuccess(response, {
      message: result.message,
      data: otpResponse,
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
          const token = await User.accessTokens.create(user)
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
      return sendError(response, { error })
    }
  }

  public async forgotPassword({ request, response }: HttpContext) {
    try {
      await request.validateUsing(emailValidator)
      const { email } = request.body()
      const result = await OtpService.sendOtp(email, { expiry: 600, forceResend: true })
      if (!result.success) {
        return sendError(response, { message: result.message })
      }

      const otpResponse: OTPResponseDTO = {
        email: lowerCase(email),
        otp: result.otp!,
        otpExpiry: result.otpExpiry!,
        type: OtpVerificationType.FORGOT_PASSWORD,
      }
      return sendSuccess(response, {
        message: LocalizationService.getMessage(request.lang, 'check_email', { email }),
        data: otpResponse,
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

  public async logout({ auth, response }: HttpContext) {
    try {
      await auth.use('api').invalidateToken()
      return sendSuccess(response, {
        message: 'Logged out successfully',
      })
    } catch (error) {
      return sendError(response, { error })
    }
  }

  public async deleteUser({ auth, response }: HttpContext) {
    try {
      const user = auth.user
      if (!user) {
        return sendError(response, { message: 'Invalid user' })
      }
      await user.delete()
      return sendSuccess(response, {
        message: `Account deactivated, log back in within ${User.ACCOUNT_DELETION_GRACE_DAYS}days to re-activate your account`,
      })
    } catch (error) {
      return sendError(response, { error })
    }
  }
}
