import User, { RegisterSource } from '#models/user'
import Factory from '@adonisjs/lucid/factories'
import { DateTime } from 'luxon'

export const UserFactory = Factory.define(User, ({ faker }) => {
  return {
    email: 'gabby@gmail.com',
    password: '123456789',
    createdAt: DateTime.fromJSDate(faker.date.past({ years: 20 })),
    updatedAt: DateTime.fromJSDate(faker.date.past({ years: 20 })),
    registerSource: RegisterSource.STANDARD,
  }
}).build()
