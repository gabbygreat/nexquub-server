import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
const UsersController = () => import('#controllers/users_controller')

router
  .group(() => {
    router.post('register', [UsersController, 'register']).use(middleware.checkUserDoesNotExist())
    router.post('login', [UsersController, 'login']).use(middleware.checkUserExist())
    router.post('login-other-source', [UsersController, 'loginOtherSource'])
    router
      .post('token-login', [UsersController, 'tokenLogin'])
      .use(middleware.auth({ guards: ['api'] }))
    router.post('request-otp', [UsersController, 'requestOtp']).use(middleware.checkUserExist())
    router.post('verify-otp', [UsersController, 'verifyOtp']).use(middleware.checkUserExist())
    router
      .post('forgot-password', [UsersController, 'forgotPassword'])
      .use(middleware.checkUserExist())
    router
      .post('reset-password', [UsersController, 'resetPassword'])
      .use(middleware.checkUserExist())
  })
  .prefix('api/user')
