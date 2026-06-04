declare namespace AnyListen {
  namespace Resource {
    interface SongListItem {
      id: string
      name: string
      play_count?: string
      author?: string
      time?: string
      img?: string
      // grade: basic.favorcnt / 10,
      desc?: string | null
      total?: number
    }
    interface SongListDetailInfo {
      name: string
      img?: string
      desc?: string
      author?: string
      play_count?: string
      date?: string
    }

    interface CommonItem {
      id: string
      name: string
    }
    type TagItem = CommonItem
    interface TagGroupItem {
      name: string
      list: CommonItem[]
    }

    interface TopSongsItem extends CommonItem {
      pic?: string
    }
    interface TopSongsDetailInfo {
      name: string
      pic?: string
      desc?: string
      date?: string
    }

    interface MusicCommentItem {
      id: string
      userId?: string
      userName: string
      text: string
      time?: number
      images?: string[]
      location?: string
      avatar?: string
      likedCount?: number
      skipPage?: boolean
      replyTotal?: number
      reply?: MusicCommentItem[]
      replySkipPage?: boolean
    }
  }
}
