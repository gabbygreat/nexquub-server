import User from '#models/user'
import { RegisterSource } from '#utils/enums'
import axios from 'axios'
import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'
const clientj = jwksClient({ jwksUri: 'https://appleid.apple.com/auth/keys' })

interface PayloadType {
  iss: string
  aud: string
  exp: number
  iat: number
  sub: string
  c_hash: string
  email: string
  email_verified: boolean
  auth_time: number
  nonce_supported: boolean
}

export default class LoginService {
  async socialLogin(provider: RegisterSource, accessToken: string): Promise<User> {
    switch (provider) {
      case 'google':
        return this.handleGoogleLogin(accessToken)

      case 'apple':
        return this.handleAppleLogin(accessToken)

      case 'facebook':
        return this.handleFacebookLogin(accessToken)

      case 'linkedin':
        return this.handleLinkedInLogin(accessToken)

      default:
        throw new Error('Unsupported provider')
    }
  }

  private async handleGoogleLogin(accessToken: string): Promise<User> {
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
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`
    )
    if (status !== 200) throw Error('Network error')

    if (!data.email_verified) throw Error('Email not verified')

    const googleUser: GoogleUser = data
    return this.findOrCreateUser(
      googleUser.email,
      RegisterSource.GOOGLE,
      googleUser.given_name,
      googleUser.family_name
    )
  }

  private async handleFacebookLogin(accessToken: string): Promise<User> {
    const { data } = await axios.get(`https://graph.facebook.com/me`, {
      params: {
        fields: 'id,name,email',
        access_token: accessToken,
      },
    })

    if (!data.email) throw Error('No email returned from Facebook')
    const [firstName, ...rest] = data.name?.split(' ') ?? []
    const lastName = rest.join(' ')
    return this.findOrCreateUser(data.email, RegisterSource.FACEBOOK, firstName, lastName)
  }

  private async handleLinkedInLogin(accessToken: string): Promise<User> {
    // Only fetch email, since that's all we need
    const emailRes = await axios.get(
      'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    )

    const email = emailRes.data.elements?.[0]?.['handle~']?.emailAddress
    if (!email) throw Error('No email returned from LinkedIn')

    // Get profile
    const profileRes = await axios.get(
      'https://api.linkedin.com/v2/me?projection=(localizedFirstName,localizedLastName)',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )

    return this.findOrCreateUser(
      email,
      RegisterSource.LINKEDIN,
      profileRes.data.localizedFirstName,
      profileRes.data.localizedLastName
    )
  }

  private async handleAppleLogin(accessToken: string): Promise<User> {
    const idToken = jwt.decode(accessToken, { complete: true })
    const kid = idToken?.header.kid
    if (!kid) throw Error('Invalid Apple token')

    const appleKey = await this.getAppleSignInKey(kid)
    if (!appleKey) throw Error('Could not retrieve Apple signing key')

    const payload: PayloadType | null = await this.verifyJWT(accessToken, appleKey)
    if (!payload) throw Error('Invalid Apple payload')
    if (!payload.email) throw Error('Invalid Apple payload')

    // Get name from request if passed separately (you’ll need to modify the Flutter side to pass this)
    const firstName = (idToken?.payload as any)?.firstName
    const lastName = (idToken?.payload as any)?.lastName

    return this.findOrCreateUser(payload.email, RegisterSource.APPLE, firstName, lastName)
  }

  private async findOrCreateUser(
    email: string,
    source: RegisterSource,
    firstName?: string,
    lastName?: string
  ): Promise<User> {
    const user = await User.findBy('email', email)
    if (user) return user

    const newUser = new User()
    newUser.email = email
    newUser.firstName = firstName ?? 'Gabby'
    newUser.lastName = lastName ?? 'Oranekwu'
    newUser.password = '**'
    newUser.registerSource = source
    await newUser.save()
    return newUser
  }

  private async verifyJWT(json: any, publick: any): Promise<PayloadType | null> {
    return new Promise((resolve) => {
      jwt.verify(json, publick, { algorithms: ['RS256'] }, (err: any, payload: any) => {
        if (err) {
          resolve(null)
        }
        resolve(payload)
      })
    })
  }

  private async getAppleSignInKey(kid: string) {
    return new Promise((resolve) => {
      clientj.getSigningKey(kid, (err: any, key: any) => {
        if (err) {
          resolve(null)
        }
        const signingKey = key.getPublicKey()
        resolve(signingKey)
      })
    })
  }
}
