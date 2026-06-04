import fs from 'node:fs/promises'
import path from 'node:path'

export interface StoreOptions {
  /** 是否批量写入，开启后多次调用writeFile只会写入一次 */
  batch?: boolean
  /** 是否安全写入，开启后会先写入临时文件再重命名 */
  safeWrite?: boolean
}

export default class Store {
  private readonly filePath: string
  private readonly dirPath: string
  private readonly batch: boolean
  private readonly safeWrite: boolean
  private immediate: NodeJS.Immediate | null = null
  private data: string | Record<string, unknown> | Buffer | Uint8Array | null = null
  private running = false

  private getFormatData() {
    if (this.data) {
      if (typeof this.data === 'object') return JSON.stringify(this.data, null, '\t')
      return this.data
    }
    return ''
  }
  private async handleWriteFile() {
    this.running = true
    if (this.safeWrite) {
      const tempPath = `${this.filePath}.${Math.random().toString().substring(2, 10)}.temp`
      try {
        await fs.writeFile(tempPath, this.getFormatData(), 'utf8')
        this.data = null
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
          try {
            await fs.mkdir(this.dirPath, { recursive: true })
            await fs.writeFile(tempPath, this.getFormatData(), 'utf8')
            this.data = null
          } catch (err) {
            this.data = null
            throw err as Error
          } finally {
            this.running = false
          }
        } else {
          this.data = null
          throw err as Error
        }
      } finally {
        this.running = false
      }
      await fs.rename(tempPath, this.filePath)
    } else {
      await fs.writeFile(this.filePath, this.getFormatData(), 'utf8').finally(() => {
        this.running = false
        this.data = null
      })
    }
  }

  constructor(filePath: string, options: StoreOptions = {}) {
    this.filePath = filePath
    this.batch = options.batch ?? false
    this.safeWrite = options.safeWrite ?? true
    this.dirPath = path.dirname(this.filePath)
  }

  async readFile(): Promise<Buffer | null> {
    if (
      await fs
        .access(this.filePath, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false)
    ) {
      return fs.readFile(this.filePath)
    }
    return null
  }
  writeFile(data: string | Record<string, unknown> | Buffer | Uint8Array) {
    this.data = data
    if (this.running) return
    if (this.batch) {
      this.immediate ??= setImmediate(() => {
        this.immediate = null
        void this.handleWriteFile()
      })
    } else void this.handleWriteFile()
  }
}
