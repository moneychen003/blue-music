export const IPC_NAMES = {
  COMMON: 'common',
  VIEW_MAIN: 'view_main',
} as const

export const IPC_MESSAGE_PREFIX = 'm2c'

export const createName = (namespace: string) => {
  return `${namespace}${IPC_MESSAGE_PREFIX}`
}
