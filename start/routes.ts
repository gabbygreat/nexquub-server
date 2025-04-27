/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import './routes/user_routes.ts'

router.get('/', async () => {
  return new Date()
})

router.get('/beat', async () => {
  return 'Heart is beating 😁'
})
