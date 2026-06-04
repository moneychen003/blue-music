import { rendererIPC } from './rendererEvent'

export { hideWindow, showWindow } from './main'

export const play = async () => {
  await rendererIPC.playerAction({ action: 'play' })
}

export const pause = async () => {
  await rendererIPC.playerAction({ action: 'pause' })
}

export const next = async () => {
  await rendererIPC.playerAction({ action: 'next' })
}

export const prev = async () => {
  await rendererIPC.playerAction({ action: 'prev' })
}

export const toggle = async () => {
  await rendererIPC.playerAction({ action: 'toggle' })
}
