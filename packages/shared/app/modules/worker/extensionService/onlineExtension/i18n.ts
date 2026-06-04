const extI18n = {
  message: {} as unknown as Record<string, string>,
  cache: new Map<string, string>(),
  locale: '',
  setMessage(locale: string, messages: Record<string, string>) {
    if (locale == this.locale) return
    this.message = messages
    this.cache.clear()
  },
  getExtMessage(extenstionId: string, transKey: string) {
    const cacheKey = `${extenstionId}_${transKey}`
    let str = this.cache.get(cacheKey)
    if (str != null) return str
    str = transKey.replace(/{([\w-.]+)}/g, (_, k) => {
      const key = `${extenstionId}.${k}`
      return this.message[key] ?? k
    })
    this.cache.set(cacheKey, str)
    return str
  },
  getMessage(transKey: string, extenstionId?: string): string {
    if (extenstionId) return this.getExtMessage(extenstionId, transKey)

    const cacheKey = transKey
    let str = this.cache.get(cacheKey)
    if (str != null) return str
    str = transKey.replace(/{([\w-.]+)}/g, (_, k: string) => {
      return this.message[k] ?? k
    })
    this.cache.set(cacheKey, str)
    return str
  },
}

export const setMessages = (locale: string, messages: Record<string, string>) => {
  extI18n.setMessage(locale, messages)
}

export const resetI18n = () => {
  extI18n.setMessage('', {})
}

export const t = extI18n.getMessage.bind(extI18n)
