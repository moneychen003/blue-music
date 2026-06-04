import { extensionEvent } from './event'

export const registerErrorHandler = () => {
  let prevError: Error
  process.on('uncaughtException', (err) => {
    if (err === prevError) return
    prevError = err
    console.error('An uncaught error occurred!')
    console.error(err)
    extensionEvent.error(err.stack ?? err.message)
    // log.error(err)
  })
  process.on('unhandledRejection', (reason, p) => {
    if (import.meta.env.DEV) console.error('Unhandled Rejection at: Promise ', p)
    throw reason instanceof Error ? reason : new Error(String(reason))
  })
}
