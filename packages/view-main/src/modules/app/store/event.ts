import WebEvent, { type EventType } from '@any-listen/web/Event'

const desktopCommands = ['minimize', 'fullscreenToggle', 'close', 'exit'] as const
const webCommands = ['logout', 'maximizeToggle'] as const
const commonCommands = [
  'play',
  'pause',
  'playToggle',
  'next',
  'previous',
  'favorite',
  'unfavorite',
  'dislike',
  'muteToggle',
  'volumeUp',
  'volumeDown',
  'seekForward',
  'seekBackward',
  'showMusicComment',
] as const
export const hiddenCommonCommands = ['run'] as const
export const localCommands = [...(import.meta.env.VITE_IS_DESKTOP ? desktopCommands : webCommands), ...commonCommands] as Array<
  | (typeof desktopCommands)[number]
  | (typeof webCommands)[number]
  | (typeof commonCommands)[number]
  | (typeof hiddenCommonCommands)[number]
>

class Event extends WebEvent {
  emitEvent<K extends keyof EventMethods>(eventName: K, ...args: unknown[]) {
    this.emit(eventName, ...args)
  }

  connected() {
    this.emitEvent('connected')
  }

  connectFailed(message: string) {
    this.emitEvent('connectFailed', message)
  }

  desconnected() {
    this.emitEvent('desconnected')
  }

  release() {
    this.emitEvent('release')
  }

  fullscreen(isFullscreen: boolean) {
    this.emitEvent('fullscreen', isFullscreen)
  }

  visible(visible: boolean) {
    this.emitEvent('visible', visible)
  }

  focus() {
    this.emitEvent('focus')
  }

  blur() {
    this.emitEvent('blur')
  }

  drag(end?: boolean) {
    this.emitEvent('drag', end)
  }

  scrollListTo(listId: string, musicId: string) {
    this.emitEvent('scrollListTo', listId, musicId)
  }

  executeCommand(command: (typeof localCommands)[number], ...args: any[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    this.emitEvent('executeCommand', command, ...args)
  }
}

type EventMethods = Omit<Event, keyof WebEvent | 'emitEvent'>

export const appEvent = new Event() as EventType<Event>
