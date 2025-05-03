import { Response } from '@adonisjs/core/http'

export function sendError(
  response: Response,
  errorDetail: Partial<{
    code: number
    message: string
    error: any
    data: any
  }>
) {
  let message =
    errorDetail.message ??
    errorDetail.error?.response?.data.error_description ??
    errorDetail.error?.message
  let status = errorDetail.code ?? errorDetail.error?.status ?? 400

  if (errorDetail.error?.code === '22P02' || status === 404) {
    status = 404
    message = message ?? "The item you're looking for does not exist."
  }
  if (errorDetail.error?.status) {
    status = errorDetail.error.status
  }
  if (errorDetail.error?.messages) {
    if (errorDetail.error?.messages.length) {
      message = errorDetail.error?.messages[0].message
    }
  }

  return response.status(status).json({
    error: true,
    message: message,
    ...(errorDetail.data !== undefined && { data: errorDetail.data }),
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
    message: data.message,
    data: data.data,
  })
}

export function lowerCase(text: string) {
  return text.toLowerCase()
}
