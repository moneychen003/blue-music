import { getLocation, push, replace, type Params } from '@/plugins/routes'
import { preferredMusicSearchSourceIds, urlParamKeyMap } from '@/views/Online/shared.svelte'

const historys: Array<[string, Params]> = []
export const setLastHistory = (path: string, query: Params) => {
  const last = historys[historys.length - 1] as [string, Params] | undefined
  if (last) {
    if (path == '/online') {
      if (query[urlParamKeyMap.type] == last[1][urlParamKeyMap.type]) return
    } else if (path == last[0]) return
  }
  historys.push([path, query])
}
export const pushRoute = (path: string, query: Params) => {
  historys.push([path, query])
  void push(path, query)
}
export const replaceRoute = (path: string, query: Params) => {
  const last = historys[historys.length - 1] as [string, Params] | undefined
  if (last) {
    last[0] = path
    last[1] = query
  } else {
    historys.push([path, query])
  }
  void replace(path, query)
}

export const back = () => {
  const loc = getLocation()
  if (loc.location.startsWith('/online')) {
    const last = historys.pop()
    if (last && historys.length) {
      const current = historys[historys.length - 1]
      void replace(current[0], current[1])
      return
    }
    void replace('/online')
  } else {
    if (historys.length) {
      const current = historys[historys.length - 1]
      void replace(current[0], current[1])
      return
    }
    void replace('/online')
  }
}

const buildQueryParams = (params: Params, text?: string) => {
  if (text != null) {
    if (text) params[urlParamKeyMap.query] = text
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    else delete params[urlParamKeyMap.query]

    if (params[urlParamKeyMap.type] != 'search') {
      params[urlParamKeyMap.type] = 'search'
    }
  }
  return params
}
const applyDefaultMusicSearchTarget = (params: Params) => {
  params[urlParamKeyMap.queryType] = 'music'
  params[urlParamKeyMap.source] = preferredMusicSearchSourceIds[0]
  return params
}
const topSongsSearchIntents = new Set(['每日推荐', '排行榜', '榜单', '排行', '热门榜单', 'topsongs', 'top songs', 'ranking', 'rankings'])
const isTopSongsSearchIntent = (text: string) => topSongsSearchIntents.has(text.trim().toLowerCase())

export const toOnlineTopSongs = async () => {
  const loc = getLocation()
  const params: Params = { [urlParamKeyMap.type]: 'topSongs' }
  if (loc.location == '/topSongs') {
    await replace('/topSongs', { ...loc.query, ...params })
  } else {
    await push('/topSongs', params)
  }
}

export const toOnlineSearch = async (text?: string) => {
  const loc = getLocation()
  const lastLoc = historys[historys.length - 1] as [string, Params] | undefined
  if (text) {
    if (isTopSongsSearchIntent(text)) {
      await toOnlineTopSongs()
      return
    }
    if (loc.location.startsWith('/online')) {
      const params = applyDefaultMusicSearchTarget(buildQueryParams({ ...loc.query }, text))
      await replace('/online', params)
    } else {
      const params = applyDefaultMusicSearchTarget(buildQueryParams({}, text))
      await push('/online', params)
    }
  } else if (loc.location.startsWith('/online')) {
    const params = buildQueryParams({ ...loc.query }, text)
    await replace('/online', params)
  } else {
    const [path, query] = lastLoc || ['/online', {}]
    const params = buildQueryParams(query, text)
    await push(path, params)
  }
}
