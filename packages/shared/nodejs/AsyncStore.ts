import AsyncFS from './AsyncFS'

export default class Store {
  private store: Record<string, unknown> = {}
  private inited = false
  private readonly asyncFS: AsyncFS
  private readonly clearInvalidConfig: boolean

  private async readStore() {
    const data = await this.asyncFS.readFile()
    return data ? (JSON.parse(data.toString()) as Record<string, unknown>) : {}
  }
  private saveStore() {
    this.asyncFS.writeFile(this.store)
  }
  private async init() {
    if (this.inited) return
    if (this.clearInvalidConfig) {
      try {
        this.store = await this.readStore()
      } catch {
        this.store = {}
      }
    } else {
      this.store = await this.readStore()
    }
    if (typeof this.store != 'object') {
      if (this.clearInvalidConfig) this.store = {}
      else throw new Error(`parse data error: ${String(this.store)}`)
    }
    this.inited = true
  }

  constructor(filePath: string, clearInvalidConfig = false, batch = false) {
    this.clearInvalidConfig = clearInvalidConfig
    this.asyncFS = new AsyncFS(filePath, { batch, safeWrite: true })
  }

  async get<V>(key: string): Promise<V | null> {
    await this.init()
    return (this.store[key] as V) ?? null
  }

  async getAll<V extends object>() {
    await this.init()
    return this.store as V
  }

  async has(key: string): Promise<boolean> {
    await this.init()
    return key in this.store
  }

  async set(key: string, value: unknown) {
    await this.init()
    this.store[key] = value
    this.saveStore()
  }

  async delete(key: string) {
    await this.init()
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete this.store[key]
    this.saveStore()
  }

  async override(value: object) {
    await this.init()
    this.store = value as Record<string, unknown>
    this.saveStore()
  }
}
