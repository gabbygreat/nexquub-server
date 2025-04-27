export enum RegisterSource {
  STANDARD = 'standard',
  GOOGLE = 'google',
  APPLE = 'apple',
  FACEBOOK = 'facebook',
  LINKEDIN = 'linkedin',
}

export const RegisterSourceHelper = {
  fromSource(source: string): RegisterSource {
    const key = source.toUpperCase() as keyof typeof RegisterSource
    return RegisterSource[key]
  },
}
