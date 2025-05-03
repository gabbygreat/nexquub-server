import User from '#models/user'
import LocalizationService from '#services/localization_service'
import { emailValidator } from '#validators/email'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { sendError } from '../utils/utils.js'

export default class CheckUserExistMiddleware {
  async handle({ request, response }: HttpContext, next: NextFn) {
    try {
      await request.validateUsing(emailValidator)
      const { email } = request.body()
      // Check if user already exists
      const existingUser = await User.withTrashed().where('email', email).first()

      if (!existingUser) {
        return sendError(response, {
          message: LocalizationService.getMessage(request.lang, 'user_does_not_exist'),
          code: 404,
        })
      }
    } catch (error) {
      return sendError(response, { error })
    }
    const output = await next()
    return output
  }
}
