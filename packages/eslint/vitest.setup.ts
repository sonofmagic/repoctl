import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const packageRoot = path.dirname(fileURLToPath(import.meta.url))

if (process.cwd() !== packageRoot) {
  process.chdir(packageRoot)
}
