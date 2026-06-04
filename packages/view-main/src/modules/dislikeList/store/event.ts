import _Event, { type EventType } from '@any-listen/web/Event'

class Event extends _Event {
  emitEvent<K extends keyof EventMethods>(eventName: K, ...args: unknown[]) {
    this.emit(eventName, ...args)
  }

  updated() {
    this.emitEvent('updated')
  }
}

type EventMethods = Omit<Event, keyof _Event | 'emitEvent'>

export const dislikeListEvent = new Event() as EventType<Event>
