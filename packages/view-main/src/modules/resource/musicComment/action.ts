// const handleFindMusicAll = async (
//   info: {
//     name: string
//     singer: string
//     albumName: string
//     interval: string | null
//   },
//   action: AnyListen.Extension.ResourceAction,
//   excludeList: string[] = []
// ): Promise<AnyListen.Music.MusicInfoOnline[]> => {
//   const searchSources = getExtSourceAll('musicSearch', excludeList)
//   let sources = searchSources
//   if (action !== 'musicSearch') {
//     const supportSources = new Set<string>()
//     for (const s of getExtSourceAll(action, excludeList)) {
//       supportSources.add(s.id)
//     }
//     sources = sources.filter((s) => supportSources.has(s.id))
//   }
//   if (!sources.length) return []
//   const sourceGroup = new Map<string, AnyListen.IPCResource.SourceItem[]>()
//   for (const s of sources) {
//     if (!sourceGroup.has(s.extensionId)) {
//       sourceGroup.set(s.extensionId, [])
//     }
//     sourceGroup.get(s.extensionId)!.push(s)
//   }
//   const results = await Promise.all(
//     sourceGroup.values().map(async (sourceList) => {
//       for (const s of sourceList) {
//         const music = await findMusicByExt({ extensionId: s.extensionId, source: s.id, ...info }).catch(() => null)
//         if (music) return { music, source: s }
//       }
//       return null
//     })
//   )
//   return results.filter((r) => r != null)
// }

// export const findMusicByAction = async (musicInfo: AnyListen.Music.MusicInfo, action: AnyListen.Extension.ResourceAction) => {
//   const sources = getExtSourceAll(action)
//   if (musicInfo.isLocal) {
//     return findMusicByLocal(musicInfo, async (info) => info)
//   }
//   return findMusicByOnline(musicInfo, async (info) => info)
// }

export { musicComment } from '@/shared/ipc/resource'
