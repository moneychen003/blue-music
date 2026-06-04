import {
  tipSearch,
  hotSearch,
  musicSearch,
  musicPicSearch,
  lyricSearch,
  getLyric,
  songlistSearch,
  songlistSorts,
  songlistTags,
  songlist,
  songlistDetail,
  topSongs,
  topSongsDate,
  topSongsDetail,
  findMusic,
  musicComment,
} from '@any-listen/app/modules/resources'

import type { ExposeClientFunctions } from '.'

// 暴露给前端的方法
export const createExposeResource = () => {
  return {
    async tipSearch(event, info) {
      return tipSearch(info)
    },
    async hotSearch(event, info) {
      return hotSearch(info)
    },
    async musicSearch(event, info) {
      return musicSearch(info)
    },
    async musicPicSearch(event, info) {
      return musicPicSearch(info)
    },
    async lyricSearch(event, info) {
      return lyricSearch(info)
    },
    async lyricDetail(event, info) {
      return getLyric(info)
    },
    async songlistSearch(event, info) {
      return songlistSearch(info)
    },
    async songlistSorts(event, info) {
      return songlistSorts(info)
    },
    async songlistTags(event, info) {
      return songlistTags(info)
    },
    async songlist(event, info) {
      return songlist(info)
    },
    async songlistDetail(event, info) {
      return songlistDetail(info)
    },
    async topSongs(event, info) {
      return topSongs(info)
    },
    async topSongsDate(event, info) {
      return topSongsDate(info)
    },
    async topSongsDetail(event, info) {
      return topSongsDetail(info)
    },
    async findMusic(event, info) {
      return findMusic(info)
    },
    async musicComment(event, info) {
      return musicComment(info)
    },
  } satisfies Partial<ExposeClientFunctions>
}
