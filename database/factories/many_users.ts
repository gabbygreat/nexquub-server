import User, { RegisterSource } from '#models/user'
import Factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'

export const ManyUsersFactory = Factory.define(User, ({ faker }) => {
  return {
    email: faker.internet.email(),
    password: faker.internet.password(),
    createdAt: DateTime.fromJSDate(faker.date.past({ years: 20 })),
    updatedAt: DateTime.fromJSDate(faker.date.past({ years: 20 })),
    registerSource: RegisterSource.STANDARD,
  }
}).build()
