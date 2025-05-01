import * as crypto from 'node:crypto'
import redis from '@adonisjs/redis/services/main'

export default class OtpService {
  private static readonly otpExpiry = 60 * 5 // 5mins

  public static async sendOtp(email: string, expiry: number = this.otpExpiry) {
    try {
      const existingOTP = await redis.get(`otp:${email}`)

      if (existingOTP) {
        return {
          success: false,
          message: 'OTP already sent. Please wait for the current OTP to expire',
        }
      }

      const otp = Math.floor(1000 + Math.random() * 9000).toString()
      const otpHash = crypto.createHash('sha256').update(otp).digest('hex')

      await redis.setex(`otp:${email}`, expiry, otpHash)

      // Trigger email or SMS service here

      return {
        success: true,
        message: 'OTP has been sent to your email',
        otp,
        otpExpiry: this.otpExpiry,
      }
    } catch (error) {
      console.error('Error sending OTP:', error)
      return {
        success: false,
        message: 'Failed to generate OTP. Please try again later',
      }
    }
  }

  public static async verifyOtp(email: string, inputOtp: string, deleteOtp: boolean = true) {
    try {
      const storedHash = await redis.get(`otp:${email}`)

      if (!storedHash) {
        return {
          success: false,
          message: 'OTP has expired or was not requested',
        }
      }

      const inputHash = crypto.createHash('sha256').update(inputOtp).digest('hex')

      if (storedHash !== inputHash) {
        return {
          success: false,
          message: 'Incorrect OTP',
        }
      }
      if (deleteOtp) {
        await redis.del(`otp:${email}`)
      }
      return {
        success: true,
        message: 'OTP verified successfully',
      }
    } catch (error) {
      console.error('Error verifying OTP:', error)
      return {
        success: false,
        message: 'Failed to verify OTP. Please try again later',
      }
    }
  }
}
