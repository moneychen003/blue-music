export default class Event {
  listeners: Map<string, Array<(...args: unknown[]) => unknown>>
  constructor() {
    this.listeners = new Map()
  }

  on(eventName: string, listener: (...args: unknown[]) => unknown) {
    let targetListeners = this.listeners.get(eventName)
    if (!targetListeners) this.listeners.set(eventName, (targetListeners = []))
    targetListeners.push(listener)
    return () => {
      this.off(eventName, listener)
    }
  }

  once(eventName: string, listener: (...args: unknown[]) => unknown) {
    const onceListener = (...args: unknown[]) => {
      this.off(eventName, onceListener)
      listener(...args)
    }
    this.on(eventName, onceListener)
    return () => {
      this.off(eventName, onceListener)
    }
  }

  off(eventName: string, listener: (...args: unknown[]) => unknown) {
    let targetListeners = this.listeners.get(eventName)
    if (!targetListeners) return
    const index = targetListeners.indexOf(listener)
    if (index < 0) return
    targetListeners.splice(index, 1)
  }

  emit(eventName: string, ...args: unknown[]) {
    setImmediate(() => {
      let targetListeners = this.listeners.get(eventName)
      if (!targetListeners) return
      for (const listener of Array.from(targetListeners)) {
        listener(...args)
      }
    })
  }

  offAll(eventName: string) {
    let targetListeners = this.listeners.get(eventName)
    if (!targetListeners) return
    this.listeners.delete(eventName)
  }

  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  z_(p: unknown) {}
}

// 添加一个参数为 unknown 的 z_ 方法解决 ts 生成 on / off 类型时的性能问题

type Gtype<E extends Event> = Omit<E, keyof Event | 'emitEvent'> & { z_: (p: unknown) => void }
export type EventType<E extends Event> = {
  on: <K extends keyof Gtype<E>>(event: K, listener: E[K]) => () => void
  once: <K extends keyof Gtype<E>>(event: K, listener: E[K]) => () => void
  off: <K extends keyof Gtype<E>>(event: K, listener: E[K]) => void
} & Omit<Gtype<E>, 'z_'>

export type EventType2<E extends Event> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on: <K extends keyof Gtype<E>>(event: K, listener: any) => () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  once: <K extends keyof Gtype<E>>(event: K, listener: any) => () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off: <K extends keyof Gtype<E>>(event: K, listener: any) => void
} & Omit<Gtype<E>, 'z_'>
