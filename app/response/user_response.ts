import User from '#models/user'
import { AccessToken } from '@adonisjs/auth/access_tokens'

interface UserResponseDTO {
  user: Omit<User, 'password'>
  token?: AccessToken
}

export default UserResponseDTO
