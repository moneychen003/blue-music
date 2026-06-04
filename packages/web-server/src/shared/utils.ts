import { checkAndCreateDirSync } from '@any-listen/nodejs/index'
export * from '@any-listen/nodejs/index'

export const exit = (message: string): never => {
  console.error(message)
  process.exit(0)
}

export const checkAndCreateDir = (path: string) => {
  try {
    checkAndCreateDirSync(path)
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'EEXIST') {
      exit(`Could not set up log directory, error was: ${(e as NodeJS.ErrnoException).message}`)
    }
  }
}
