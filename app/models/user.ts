import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { RegisterSource } from '#utils/enums'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import MessagingToken from './messaging_token.js'
import { SoftDeletes } from 'adonis-lucid-soft-deletes'
import { Exception } from '@adonisjs/core/exceptions'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder, SoftDeletes) {
  static readonly ACCOUNT_DELETION_GRACE_DAYS = 7

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare firstName: string

  @column()
  declare lastName: string

  @column()
  declare email: string

  @column()
  declare verified: boolean

  @column({ serializeAs: null })
  declare password: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column()
  declare registerSource: RegisterSource

  static readonly accessTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '30 days',
  })

  @hasMany(() => MessagingToken)
  declare messagingTokens: HasMany<typeof MessagingToken>

  async restoreIfNotExpired(): Promise<boolean> {
    if (!this.deletedAt) return true

    const daysSinceDeletion = this.deletedAt.diffNow('days').days
    if (daysSinceDeletion > -User.ACCOUNT_DELETION_GRACE_DAYS) {
      this.deletedAt = null
      await this.save()
      return true
    }
    return false
  }

  static async verifyCredential(email: string, password: string): Promise<User> {
    const user = (await User.withTrashed().where('email', email).first()) as User
    if (!user) {
      throw new Exception('User not found', { status: 404 })
    }
    const isValid = await hash.verify(user.password, password)
    if (!isValid) {
      throw new Exception('Invalid credentials', { status: 401 })
    }
    return user
  }
}
