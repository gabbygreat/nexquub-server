import User from '#models/user'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'
import cron from 'node-cron'

export default class DeleteExpiredUsers {
  public static async handle() {
    cron.schedule('0 0 * * *', async () => {
      try {
        const expiryDate = DateTime.local().minus({ days: User.ACCOUNT_DELETION_GRACE_DAYS })
        const expiredUsers = await User.withTrashed()
          .whereNotNull('deleted_at')
          .where('deleted_at', '<=', expiryDate.toSQL())
        for (const user of expiredUsers) {
          await (user as User).forceDelete()
        }
      } catch (error) {
        logger.error('❌ Failed to delete users', error)
      }
    })
  }
}
