import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class DetectLanguageMiddleware {
  async handle({ request }: HttpContext, next: NextFn) {
    request.lang = request.header('Accept-Language') ?? 'en'
    await next()
    const output = await next()
    return output
  }
}
