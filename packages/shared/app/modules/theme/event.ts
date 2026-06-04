import _Event, { type EventType } from '@any-listen/nodejs/Event'

export class Event extends _Event {
  emitEvent<K extends keyof EventMethods>(eventName: K, ...args: any[]) {
    this.emit(eventName, ...args)
  }

  theme_change(theme: AnyListen.ThemeSetting) {
    this.emitEvent('theme_change', theme)
  }

  theme_list_change(theme: AnyListen.ThemeList) {
    this.emitEvent('theme_list_change', theme)
  }
}

type EventMethods = Omit<Event, keyof _Event | 'emitEvent'>

export const themeEvent = new Event() as EventType<Event>
