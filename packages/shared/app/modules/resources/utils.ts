// import { state } from './shared'

import { resourceState } from './shared'

export const TRY_QUALITYS_LIST = ['flac24bit', 'flac', '320k'] as const
// type TryQualityType = (typeof TRY_QUALITYS_LIST)[number]
// export const getPlayQuality = (
//   playQuality: AnyListen.Music.Quality,
//   musicInfo: AnyListen.Music.MusicInfoOnline
// ): AnyListen.Music.Quality => {
//   let type: AnyListen.Music.Quality = '128k'
//   if (TRY_QUALITYS_LIST.includes(playQuality as TryQualityType)) {
//     let list = state.resources.musicUrl[musicInfo.source]

//     let t = TRY_QUALITYS_LIST.slice(TRY_QUALITYS_LIST.indexOf(playQuality as TryQualityType)).find(
//       (q) => musicInfo.meta._qualitys[q] && list?.includes(q)
//     )

//     if (t) type = t
//   }
//   return type
// }

export const buildExtSourceId = (source: string, extensionId: string) => `${extensionId}__${source}`
/**
 * @description 获取资源来源的扩展信息
 * @param action 资源行为，如 musicSearch、lyricSearch 等
 * @param exclude 排除的来源，格式为 extensionId__source
 * @param source 指定来源 source 字段
 * @returns 来源信息，包含 extensionId、source、name 等字段
 * @example
 * getExtSource('musicSearch', [], 'netease') // 获取 source 字段为 netease 的音乐搜索资源来源信息
 * getExtSource('lyricSearch', ['ext1__source1']) // 获取 lyricSearch 资源来源信息，排除 ext1__source1
 * getExtSource('musicSearch') // 获取任意一个 musicSearch 资源来源信息
 */
export const getExtSource = <T extends AnyListen.Extension.ResourceAction>(
  action: T,
  exclude: string[] = [],
  source?: string
) => {
  return (resourceState.resources[action] ?? []).find(
    (r) => (!source || r.id == source) && !exclude.includes(buildExtSourceId(r.extensionId, r.id))
  )
}

// 自动换源时的来源优先级:数字越小越先尝试。
// 0 = 由聚合音源(lx-api-source-loader)直接取址的国内源(kg/wy/tx/mg/kw),最稳;
// 1 = 其他国内源(netease/kuwo/tencent/qq/migu/joox/bilibili);
// 2 = 海外源(tidal/qobuz/apple/ytmusic/spotify 等),多半无此曲且慢,最后才试。
// 目的:避免换源时先把 gdstudio 的 10 个源(含一堆海外源)全遍历完才轮到可靠的 kg,导致前端 25s 超时跳过。
const SOURCE_RANK: Record<string, number> = {
  kg: 0, wy: 0, tx: 0, mg: 0, kw: 0,
  netease: 1, kuwo: 1, tencent: 1, qq: 1, migu: 1, joox: 1, bilibili: 1, bili: 1,
}
const getSourceRank = (id: string) => SOURCE_RANK[id] ?? 2
/**
 * 同 getExtSource,但在多个可用来源中按上面的可靠性优先级挑选(用于自动换源搜索)。
 */
export const getPreferredExtSource = <T extends AnyListen.Extension.ResourceAction>(
  action: T,
  exclude: string[] = []
) => {
  const list = (resourceState.resources[action] ?? []).filter(
    (r) => !exclude.includes(buildExtSourceId(r.extensionId, r.id))
  )
  if (!list.length) return undefined
  // 稳定排序:按 rank 升序;rank 相同则保持原注册顺序
  return list
    .map((r, i) => ({ r, i }))
    .sort((a, b) => getSourceRank(a.r.id) - getSourceRank(b.r.id) || a.i - b.i)[0].r
}

const httpRxp = /^(?:(?:https?|file):\/\/\S+|(?:\.{0,2})\/(?!\/)\S*)$/
const httpRxpWebServer = /^(?:https?:\/\/\S+|(?:\.{0,2})\/(?!\/)\S*)$/
export const allowedUrl = (url: string) => {
  if (import.meta.env.VITE_IS_DESKTOP) return httpRxp.test(url)
  return httpRxpWebServer.test(url)
}
