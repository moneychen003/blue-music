import { DEFAULT_LANG } from '@any-listen/common/constants'
import { compareVersions } from '@any-listen/common/utils'
import type { Locale } from '@any-listen/i18n'
import { mirrorRequest } from '@any-listen/nodejs/mirrorReuqest'

import { extensionEvent } from '../event'
import { extensionState } from '../state'
import { setMessages, t } from './i18n'

const API_URL = 'https://raw.githubusercontent.com/any-listen/any-listen-extension-store/main/datas'

let datas = {
  tags: null as AnyListen.IPCExtension.OnlineTagResult | null,
  categories: null as AnyListen.IPCExtension.OnlineCategorieResult | null,
  list: null as AnyListen.IPCExtension.RemoteOnlineListItem[] | null,
  i18nMessages: {} as Partial<Record<Locale, Record<string, string>>>,
  i18nLocale: '' as Locale | '',
  i18nPromise: null as Promise<void> | null,
}

const getRemoteI18nMessages = async (lang: Locale) => {
  if (!datas.i18nMessages[lang]) {
    let { body, statusCode } = await mirrorRequest<Record<string, string> | null>(`${API_URL}/i18n/${lang}.json`)
    if (statusCode == 404) {
      body = {} // No i18n data for this locale, return empty object
    } else if (statusCode == 200) {
      if (!body || typeof body !== 'object' || Object.values(body).some((val) => typeof val !== 'string')) {
        body = {} // Invalid i18n data, set empty object
      }
    } else throw new Error(`Failed to fetch i18n data for ${lang}: ${statusCode}`)
    datas.i18nMessages[lang] = body
  }
  return datas.i18nMessages[lang]
}

const initI18nMessages = async (skipCache = false) => {
  if (!datas.i18nPromise || datas.i18nLocale != extensionState.locale || skipCache) {
    const currentLocale = extensionState.locale
    datas.i18nLocale = currentLocale
    datas.i18nPromise = Promise.all([getRemoteI18nMessages(DEFAULT_LANG), getRemoteI18nMessages(extensionState.locale)])
      .then(([fallback, target]) => {
        if (datas.i18nLocale != currentLocale) throw new Error('Locale changed during fetching i18n messages')
        setMessages(currentLocale, { ...fallback, ...target })
      })
      .catch((err) => {
        datas.i18nPromise = null
        throw err
      })
  }
  return datas.i18nPromise
}

const getRemoteOnlineTags = async (): Promise<AnyListen.IPCExtension.OnlineTagResult> => {
  if (!datas.tags) {
    const { body } = await mirrorRequest<AnyListen.IPCExtension.OnlineTagResult | null>(`${API_URL}/tags.json`)

    if (!body || !Array.isArray(body)) throw new Error('Invalid tags data')
    if (body.length) {
      if (typeof body[0]?.id != 'string' || typeof body[0]?.name != 'string') throw new Error('Invalid tags data')
    }
    datas.tags = body
  }
  return datas.tags
}

export const getOnlineTags = async (): Promise<AnyListen.IPCExtension.OnlineTagResult> => {
  const [datas] = await Promise.all([getRemoteOnlineTags(), initI18nMessages()])

  return datas.map((item) => {
    return { ...item, name: t(item.name, item.id) }
  })
}

const getRemoteOnlineCategories = async (): Promise<AnyListen.IPCExtension.OnlineCategorieResult> => {
  if (!datas.categories) {
    const { body } = await mirrorRequest<AnyListen.IPCExtension.OnlineCategorieResult | null>(`${API_URL}/categories.json`)

    if (!body || !Array.isArray(body)) throw new Error('Invalid categories data')
    if (body.length) {
      if (typeof body[0]?.id != 'string' || typeof body[0]?.name != 'string') throw new Error('Invalid categories data')
    }
    datas.categories = body
  }
  return datas.categories
}
export const getOnlineCategories = async (): Promise<AnyListen.IPCExtension.OnlineCategorieResult> => {
  const [datas] = await Promise.all([getRemoteOnlineCategories(), initI18nMessages()])

  return datas.map((item) => {
    return { ...item, name: t(item.name, item.id) }
  })
}

const buildNewVersionInfo = () => {
  const extMap = new Map<string, AnyListen.Extension.Extension>()
  for (const ext of extensionState.extensions) extMap.set(ext.id, ext)

  const newVersionInfo: Record<string, string> = {}
  for (const item of datas.list ?? []) {
    const target = extMap.get(item.id)
    if (target && compareVersions(target.version, item.version) < 0) {
      newVersionInfo[item.id] = item.version
    }
  }
  extensionState.newExtensionVersions = newVersionInfo
  extensionEvent.newVersionInfoUpdated(newVersionInfo)
}
const getList = async (skipCache = false): Promise<AnyListen.IPCExtension.RemoteOnlineListItem[]> => {
  if (!datas.list || skipCache) {
    const { body } = await mirrorRequest<{ all: AnyListen.IPCExtension.RemoteOnlineListItem[] } | null>(`${API_URL}/list.json`)

    if (!body || !Array.isArray(body.all)) throw new Error('Invalid list data')
    if (body.all.length) {
      if (typeof body.all[0]?.id != 'string' || typeof body.all[0]?.name != 'string') throw new Error('Invalid list data')
    }
    datas.list = body.all
    buildNewVersionInfo()
  }
  return datas.list
}

export const getOnlineExtensionList = async (
  options: AnyListen.IPCExtension.OnlineListFilterOptions
): Promise<AnyListen.IPCExtension.OnlineListResult> => {
  const [list] = await Promise.all([getList(options.skipCache), initI18nMessages(options.skipCache)])

  const extMap = new Map<string, AnyListen.Extension.Extension>()
  for (const ext of extensionState.extensions) extMap.set(ext.id, ext)

  return {
    total: list.length,
    page: options.page,
    limit: options.limit,
    list: list.slice((options.page - 1) * options.limit, options.page * options.limit).map((item) => {
      if (item.description) return { ...item, description: t(item.description, item.id) }
      return item
    }),
  }
}

const buildContributorInfo = (extId: string, contributes: AnyListen.Extension.Manifest['contributes']) => {
  if (!contributes) return contributes
  const result: AnyListen.Extension.Manifest['contributes'] = {}
  if (contributes.commands) {
    result.commands = contributes.commands.map((cmd) => {
      return { ...cmd, name: t(cmd.name, extId) }
    })
  }
  if (contributes.settings) {
    result.settings = contributes.settings.map((setting) => {
      return { ...setting, name: t(setting.name, extId), description: setting.description ? t(setting.description, extId) : '' }
    })
  }
  if (contributes.resource) {
    result.resource = contributes.resource.map((res) => {
      return { ...res, name: t(res.name, extId) }
    })
  }
  if (contributes.listProviders) {
    result.listProviders = contributes.listProviders.map((provider) => {
      return {
        ...provider,
        name: t(provider.name, extId),
        description: provider.description ? t(provider.description, extId) : '',
      }
    })
  }
  return result
}
export const getOnlineExtensionDetail = async (id: string): Promise<AnyListen.IPCExtension.RemoteOnlineDetail | null> => {
  const resp = await mirrorRequest<AnyListen.IPCExtension.RemoteOnlineDetail>(`${API_URL}/registry/${id}.json`)
  if (resp.statusCode == 404) return null
  if (resp.statusCode !== 200) throw new Error(`Failed to fetch extension detail for ${id}: ${resp.statusMessage}`)
  return {
    ...resp.body,
    description: resp.body.description ? t(resp.body.description, resp.body.id) : '',
    contributes: buildContributorInfo(resp.body.id, resp.body.contributes),
  }
}

// TODO
// export const resetOnlineData = () => {
//   datas.categories = null
//   datas.tags = null
//   datas.list = null
//   datas.i18nMessages = {}
//   datas.i18nLocale = ''
//   datas.i18nPromise = null
// }

export const initOnlineList = async () => {
  try {
    await getList()
    // TODO: check update
  } catch {
    if (import.meta.env.DEV) console.error('Failed to fetch online extension list')
    // setTimeout(initOnlineList, 5000)
  }

  extensionEvent.on('listChanged', buildNewVersionInfo)
}
