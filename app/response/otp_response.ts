import { OtpVerificationType } from '#validators/otp'

interface OTPResponseDTO {
  email: string
  otp: string
  otpExpiry: number
  type: OtpVerificationType
}

export default OTPResponseDTO
