import User from '#models/user'
import { googleLoginValidator, registrationValidator } from '#validators/register'
import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import { lowerCase, sendError, sendSuccess } from '../utils/utils.js'
import LocalizationService from '#services/localization_service'
import { loginValidator } from '#validators/login'
import LoginService from '#services/login_service'
import AuthResponseDTO from '../response/user_response.js'
import redis from '@adonisjs/redis/services/main'
import * as crypto from 'node:crypto'
import { RegisterSourceHelper } from '#utils/enums'

@inject()
export default class UsersController {
  constructor(protected loginService: LoginService) {}
  async register({ request, response }: HttpContext) {
    try {
      await request.validateUsing(registrationValidator)
      const { email, password } = request.body()
      const user = await db.transaction(async (client) => {
        const newUser = await User.create({ email: lowerCase(email), password }, { client })
        return newUser
      })
      const token = await User.accessTokens.create(user)
      const userDTO: AuthResponseDTO = {
        user: user,
        token,
      }
      return sendSuccess(response, {
        message: LocalizationService.getMessage(request.lang, 'account_created'),
        data: userDTO,
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
      const token = await User.accessTokens.create(user)
      const userDTO: AuthResponseDTO = {
        user: user,
        token,
      }
      return sendSuccess(response, {
        message: LocalizationService.getMessage(request.lang, 'login_success'),
        data: userDTO,
        code: 200,
      })
    } catch (error) {
      return sendError(response, { error })
    }
  }

  async loginOtherSource({ request, response }: HttpContext) {
    try {
      await request.validateUsing(googleLoginValidator)
      const { accessToken, source } = request.body()
      let user: User

      const registerSource = RegisterSourceHelper.fromSource(source)
      user = await this.loginService.socialLogin(registerSource, accessToken)
      const token = await User.accessTokens.create(user, [], { expiresIn: '100 days' })
      const userDTO: AuthResponseDTO = {
        user: user,
        token,
      }
      return sendSuccess(response, {
        message: LocalizationService.getMessage(request.lang, 'login_success'),
        data: userDTO,
        code: 200,
      })
    } catch (error) {
      return sendError(response, { code: 500, error: error })
    }
  }

  /**
   * Generate OTP, hash it, and store it in Redis
   */
  public async generateOtp({ request, response }: HttpContext) {
    const { email } = request.body()

    // Check if OTP already exists and is not expired
    const existingOTP = await redis.get(`otp:${email}`)

    if (existingOTP) {
      // If OTP exists and hasn't expired yet, return a message to wait for expiration
      return sendError(response, {
        message: 'OTP already sent. Please wait for the current OTP to expire.',
      })
    }

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Hash the OTP using SHA256
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex')

    // Store the hashed OTP in Redis with a 1-minute expiration time (60 seconds)
    await redis.setex(`otp:${email}`, 60, otpHash)

    // Normally, you'd send the OTP via email or SMS, not include it in the response
    return sendSuccess(response, {
      message: 'OTP has been sent to your email',
      data: { otp },
    })
  }

  /**
   * Verify OTP by comparing the hash
   */
  public async verifyOtp({ request, response }: HttpContext) {
    const { email, otp } = request.body()

    // Retrieve the stored OTP hash from Redis
    const storedOtpHash = await redis.get(`otp:${email}`)

    if (!storedOtpHash) {
      return sendError(response, {
        message: 'OTP has expired or does not exist',
      })
    }

    // Hash the submitted OTP and compare it with the stored OTP hash
    const submittedOtpHash = crypto.createHash('sha256').update(otp).digest('hex')

    if (submittedOtpHash === storedOtpHash) {
      // OTP matches, proceed with further actions
      await redis.del(`otp:${email}`)
      return sendSuccess(response, {
        message: 'OTP verified successfully',
      })
    }

    return sendError(response, {
      message: 'Invalid OTP',
    })
  }
}
