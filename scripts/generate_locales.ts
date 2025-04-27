import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const localesPath = path.join(dirname, '../resources/locales/en.arb') // Default locale
const typesDir = path.join(dirname, '../app/types') // Ensure the directory exists
const outputPath = path.join(typesDir, 'locales.d.ts')

// ✅ Create the directory if it doesn't exist
if (!fs.existsSync(typesDir)) {
  fs.mkdirSync(typesDir, { recursive: true })
}

const translations = JSON.parse(fs.readFileSync(localesPath, 'utf8'))
const keys = Object.keys(translations)

const typeDef = `export type TranslationKeys =\n  | "${keys.join('"\n  | "')}"\n`
fs.writeFileSync(outputPath, typeDef, 'utf8')

console.log('✅ Translation keys generated successfully!')
