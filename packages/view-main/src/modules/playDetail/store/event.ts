import WebEvent, { type EventType } from '@any-listen/web/Event'

class Event extends WebEvent {
  emitEvent<K extends keyof EventMethods>(eventName: K, ...args: unknown[]) {
    this.emit(eventName, ...args)
  }

  visible(visible: boolean) {
    this.emitEvent('visible', visible)
  }
}

type EventMethods = Omit<Event, keyof WebEvent | 'emitEvent'>

export const playDetailEvent = new Event() as EventType<Event>
