import type { HOTKEY_Type } from '@any-listen/common/hotKey'
import _Event, { type EventType } from '@any-listen/nodejs/Event'

export class Event extends _Event {
  emitEvent<K extends keyof EventMethods>(eventName: K, ...args: any[]) {
    this.emit(eventName, ...args)
  }

  hot_key_down(keyInfo: AnyListen.HotKey.HotKeyDownInfo) {
    this.emitEvent('hot_key_down', keyInfo)
  }

  hot_key_config_update(config: AnyListen.HotKey.HotKeyConfigAll<HOTKEY_Type>) {
    this.emitEvent('hot_key_config_update', config)
  }
}

type EventMethods = Omit<Event, keyof _Event | 'emitEvent'>

export const hotKeyEvent = new Event() as EventType<Event>
