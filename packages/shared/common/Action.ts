/* eslint-disable @typescript-eslint/no-explicit-any */
export default class Action {
  private readonly actions: Map<string, (...args: any[]) => unknown>
  constructor() {
    this.actions = new Map()
  }

  exec(actionName: string, ...args: unknown[]) {
    return this.actions.get(actionName)!(...args)
  }

  register(actionName: string, listener: (...args: any[]) => unknown) {
    this.actions.set(actionName, listener)
  }

  // unregister(actionName: string) {
  //   if (!this.actions.has(actionName)) return
  //   this.actions.delete(actionName)
  // }

  // unregisterAll() {
  //   this.actions.clear()
  // }
}
