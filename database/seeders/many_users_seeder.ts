import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { ManyUsersFactory } from '#database/factories/many_users'
import User from '#models/user'

export default class extends BaseSeeder {
  public async run() {
    const users = await ManyUsersFactory.createMany(10)
    for (const user of users) {
      await User.accessTokens.create(user)
    }
  }
}
