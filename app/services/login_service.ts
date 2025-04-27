import User, { RegisterSource } from '#models/user'
import axios from 'axios'

export default class LoginService {
  async googleLoginService(access_token: string): Promise<User> {
    interface GoogleUser {
      sub: string
      name: string
      given_name: string
      family_name: string
      picture: string
      email: string
      email_verified: boolean
      locale: string
    }

    const { data, status } = await axios.get(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`
    )
    if (status !== 200) {
      throw Error('Network error')
    }
    const googleUser: GoogleUser = data
    if (googleUser.email_verified) {
      const user = await User.findBy('email', googleUser.email)
      if (user) {
        return user
      } else {
        const newUser = await User.create({
          email: googleUser.email,
          password: '**',
          registerSource: RegisterSource.GOOGLE,
        })
        await newUser.save()
        return newUser
      }
    } else {
      throw Error('Invalid user')
    }
  }
}
