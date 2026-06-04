import { LRUCache } from 'lru-cache'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export const createCache = <T extends {}>(options: { max?: number; ttl?: number; updateAgeOnGet?: boolean } = {}) => {
  const cache = new LRUCache<string, T>({
    max: options.max || 1000,
    ttl: options.ttl || 1000 * 60 * 60 * 24 * 2,
    updateAgeOnGet: options.updateAgeOnGet,
  })

  return {
    get<V = T>(key: string) {
      return cache.get(key) as V | null
    },

    set(key: string, value: T) {
      return cache.set(key, value)
    },

    has(key: string) {
      return cache.has(key)
    },

    delete(key: string) {
      return cache.delete(key)
    },

    clear() {
      cache.clear()
    },
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type Cache<T extends {}> = ReturnType<typeof createCache<T>>
