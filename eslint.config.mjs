import { FlatCompat } from '@eslint/eslintrc'

// Le regole di Next (core-web-vitals) nel formato di configurazione di ESLint 9:
// `next lint` non esiste più da Next 16, si lancia eslint direttamente
const compat = new FlatCompat({ baseDirectory: import.meta.dirname })

const config = [
  { ignores: ['.next/**', 'node_modules/**', 'build/**', 'next-env.d.ts'] },
  ...compat.extends('next/core-web-vitals'),
]

export default config
