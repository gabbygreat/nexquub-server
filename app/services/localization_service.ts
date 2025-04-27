import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { TranslationKeys } from '../types/locales.js'

// Define __dirname for ES modules
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

class LocalizationService {
  private static readonly translations: Record<string, any> = {}

  static loadTranslations(lang: string) {
    const filePath = path.join(dirname, `../../resources/locales/${lang}.arb`)
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'))
    }
    return JSON.parse(fs.readFileSync(path.join(dirname, '../../resources/locales/en.arb'), 'utf8')) // Default to English
  }

  static getMessage(lang: string, key: TranslationKeys) {
    this.translations[lang] ??= this.loadTranslations(lang)
    return this.translations[lang]?.[key] ?? key // Return key if not found
  }
}

export default LocalizationService
