import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { sendError } from '../utils/utils.js'
import LocalizationService from '#services/localization_service'
import { emailValidator } from '#validators/email'

export default class CheckUserDoesNotExistMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    try {
      await request.validateUsing(emailValidator)
      const { email } = request.body()
      // Check if user already exists
      const existingUser = await User.withTrashed().where('email', email).first()
      if (existingUser) {
        return sendError(response, {
          message: LocalizationService.getMessage(request.lang, 'user_exists'),
          code: 409,
        })
      }
    } catch (error) {
      return sendError(response, { error })
    }
    const output = await next()
    return output
  }
}
