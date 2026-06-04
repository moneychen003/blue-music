import { sendMusicListAction } from '@any-listen/app/modules/musicList'
import { getPlayInfo as getPlayInfoRaw } from '@any-listen/app/modules/player'
import { LIST_IDS } from '@any-listen/common/constants'

import { appState } from '@/app'
import { workers } from '@/worker'

export const checkCollect = async (minfo: AnyListen.Player.PlayMusicInfo) => {
  if (minfo.listId == LIST_IDS.LOVE) return true
  // 先按精确 id;再按 歌名+歌手 回退,让同一首歌换源/换入口播放也能认出已收藏
  if (workers.dbService.checkListExistMusic(LIST_IDS.LOVE, minfo.musicInfo.id)) return true
  return workers.dbService.checkListExistMusicByName(LIST_IDS.LOVE, minfo.musicInfo.name, minfo.musicInfo.singer)
}

// export const updatePlayCount = (name?: string, singer?: string, count?: number) => {
//   if (name) workers.dbService.playCountAdd({ name, singer: singer! })
//   workers.dbService.updateMetadataPlayCount(count)
// }

export const getPlayInfo = async (): Promise<AnyListen.IPCPlayer.PlayInfo> => {
  const playInfo = await getPlayInfoRaw()
  const [[list, isCollect], { listId, source }, historyList] = await Promise.all([
    workers.dbService.getPlayList().then(async (list) => {
      const minfo = list[playInfo.index]
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!minfo) return [list, false] as const
      return [list, await checkCollect(minfo)] as const
    }),
    workers.dbService.queryMetadataPlayListInfo(),
    workers.dbService.queryMetadataPlayHistoryList(),
  ])
  return {
    info: playInfo,
    list,
    listId,
    source,
    historyList,
    isCollect,
  }
}

export const getPlayerMusic = async (): Promise<AnyListen.Player.PlayMusicInfo | null> => {
  const playInfo = await getPlayInfoRaw()
  const list = await workers.dbService.getPlayList()
  return list[playInfo.index] ?? null
}

export const collectMusic = async () => {
  const music = await getPlayerMusic()
  if (!music) return
  await sendMusicListAction({
    action: 'list_music_add',
    data: {
      id: LIST_IDS.LOVE,
      musicInfos: [music.musicInfo],
      addMusicLocationType: appState.appSetting['list.addMusicLocationType'],
    },
  })
}

export const uncollectMusic = async () => {
  const music = await getPlayerMusic()
  if (!music) return
  await sendMusicListAction({
    action: 'list_music_remove',
    data: {
      listId: LIST_IDS.LOVE,
      ids: [music.musicInfo.id],
    },
  })
}
