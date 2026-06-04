import { hostCallActions } from '@/host/hostActions'
import { hostContext } from '@/host/state'

const sendLog = (type: AnyListen.ExtensionVM.HostCallActions['logcat']['type'], messages: unknown[]) => {
  hostCallActions('logcat', {
    type,
    timestamp: Date.now(),
    id: hostContext.extension.id,
    name: hostContext.extension.name,
    message: messages
      .map((m) => (typeof m == 'string' ? m : m instanceof Error ? (m.stack ?? m.message) : JSON.stringify(m)))
      .join(' '),
  })
}

export const logcat = {
  debug(...args: unknown[]) {
    sendLog('debug', args)
  },
  info(...args: unknown[]) {
    sendLog('info', args)
  },
  warn(...args: unknown[]) {
    sendLog('warn', args)
  },
  error(...args: unknown[]) {
    sendLog('error', args)
  },
}
