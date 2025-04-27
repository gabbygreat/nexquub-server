import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { UserFactory } from '#database/factories/user'

export default class extends BaseSeeder {
  public async run() {
    await UserFactory.create()
  }
}
