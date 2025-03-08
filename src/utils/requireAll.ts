import fs from 'fs'
import path from 'path'

const DEFAULT_EXCLUDE_DIR = /^\./
const DEFAULT_FILTER = /^([^.].*)\.js(on)?$/
const DEFAULT_RECURSIVE = true

interface RequireAllOptions {
  dirname: string
  excludeDirs?: RegExp
  filter?: RegExp | ((filename: string) => string | undefined)
  recursive?: boolean
  resolve?: (module: any) => any
  map?: (name: string, filepath: string) => string
}

export function requireAll(options: RequireAllOptions) {
  const {
    dirname,
    excludeDirs = DEFAULT_EXCLUDE_DIR,
    filter = DEFAULT_FILTER,
    recursive = DEFAULT_RECURSIVE,
    resolve = identity,
    map = identity,
  } = options

  const modules: any = {}

  function excludeDirectory(dirname: string): boolean {
    return !recursive || (excludeDirs && dirname.match(excludeDirs) !== null)
  }

  function filterFile(filename: string): string | undefined {
    if (typeof filter === 'function') {
      return filter(filename)
    }

    const match = filename.match(filter)
    if (!match) return undefined

    return match[1] || match[0]
  }

  const files = fs.readdirSync(dirname)

  for (const file of files) {
    const filepath = path.join(dirname, file)
    if (fs.statSync(filepath).isDirectory()) {
      if (excludeDirectory(file)) continue

      const subModules = requireAll({
        dirname: filepath,
        filter,
        excludeDirs,
        map,
        resolve,
        recursive,
      })

      if (Object.keys(subModules).length === 0) continue

      modules[map(file, filepath)] = subModules
    } else {
      const name = filterFile(file)
      if (!name) continue

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const module = require(filepath)
      modules[map(name, filepath)] = resolve(module)
    }
  }

  return modules
}

function identity<T>(val: T): T {
  return val
}
