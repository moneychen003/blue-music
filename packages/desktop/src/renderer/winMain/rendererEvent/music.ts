import { getLyricInfo, getMusicPic, getMusicUrl } from '@/modules/music'
import { workers } from '@/worker'

import type { ExposeFunctions } from '.'

// 暴露给前端的方法
export const createExposeMusic = () => {
  return {
    async getMusicUrl(event, info) {
      return getMusicUrl(info)
    },
    async getMusicUrlCount(event) {
      return workers.dbService.musicUrlCount()
    },
    async clearMusicUrl(event) {
      return workers.dbService.musicUrlClear()
    },

    async getMusicPic(event, info) {
      return getMusicPic(info)
    },

    async getMusicLyric(event, info) {
      return getLyricInfo(info)
    },
    async setMusicLyric(event, id, info) {
      return workers.dbService.editedLyricSave(id, info)
    },
    async removeMusicLyric(event, id) {
      return workers.dbService.editedLyricRemove([id])
    },
    async getMusicLyricCount(event) {
      return workers.dbService.rawLyricCount()
    },
    async clearMusicLyric(event) {
      return workers.dbService.rawLyricClear()
    },

    async createLocalMusicInfos(event, paths) {
      return workers.utilService.createLocalMusicInfos(paths, true)
    },
  } satisfies Partial<ExposeFunctions>
}
