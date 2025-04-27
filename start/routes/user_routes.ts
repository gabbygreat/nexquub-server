import router from '@adonisjs/core/services/router'
const UsersController = () => import('#controllers/users_controller')
import { middleware } from '#start/kernel'

router
  .group(() => {
    router.post('register', [UsersController, 'register']).use(middleware.checkUserDoesNotExist())
    router.post('login', [UsersController, 'login']).use(middleware.checkUserExist())
    router.post('login-other-source', [UsersController, 'loginOtherSource'])
    router.post('generate-otp', [UsersController, 'generateOtp'])
    router.post('verify-otp', [UsersController, 'verifyOtp'])
  })
  .prefix('api/user')
