import { Response } from '@adonisjs/core/http'

export function sendError(
  response: Response,
  data: Partial<{
    code: number
    message: string
    error: any
  }>
) {
  let message = data.message ?? data.error?.message
  let status = data.code ?? data.error?.status ?? 400

  if (data.error?.code === '22P02' || status === 404) {
    status = 404
    message = "The item you're looking for does not exist."
  }
  if (data.error?.status) {
    status = data.error.status
  }
  if (data.error?.messages) {
    if (data.error?.messages.length) {
      message = data.error?.messages[0].message
    }
  }

  return response.status(status).json({
    error: true,
    code: status,
    message: message,
  })
}

export function sendSuccess(
  response: Response,
  data: Partial<{
    message?: string
    data?: any
    code?: any
  }>
) {
  return response.status(data.code ?? 200).json({
    error: false,
    code: data.code,
    message: data.message,
    data: data.data,
  })
}

export function lowerCase(text: string) {
  return text.toLowerCase()
}
