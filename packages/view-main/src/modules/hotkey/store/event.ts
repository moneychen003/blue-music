import type { HOTKEY_Type } from '@any-listen/common/hotKey'

const nextTick = typeof queueMicrotask === 'function' ? queueMicrotask : setTimeout

export default class Event {
  listeners: Map<string, Array<() => void>>
  constructor() {
    this.listeners = new Map()
  }

  on(eventName: HOTKEY_Type, listener: () => void) {
    let targetListeners = this.listeners.get(eventName)
    if (!targetListeners) this.listeners.set(eventName, (targetListeners = []))
    targetListeners.push(listener)
    return () => {
      this.off(eventName, listener)
    }
  }

  off(eventName: HOTKEY_Type, listener: () => void) {
    let targetListeners = this.listeners.get(eventName)
    if (!targetListeners) return
    const index = targetListeners.indexOf(listener)
    if (index < 0) return
    targetListeners.splice(index, 1)
  }

  emit(eventName: HOTKEY_Type) {
    nextTick(() => {
      let targetListeners = this.listeners.get(eventName)
      if (!targetListeners) return
      for (const listener of Array.from(targetListeners)) {
        listener()
      }
    })
  }

  offAll(eventName: HOTKEY_Type) {
    let targetListeners = this.listeners.get(eventName)
    if (!targetListeners) return
    this.listeners.delete(eventName)
  }
}

export const hotkeyEvent = new Event()
