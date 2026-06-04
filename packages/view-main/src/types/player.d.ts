// declare namespace AnyListen {
//   namespace Player {
//     interface PlayMusicInfo {
//       /**
//        * 当前播放歌曲的列表 id
//        */
//       musicInfo: AnyListen.Download.ListItem | AnyListen.Music.MusicInfo
//       /**
//         * 当前播放歌曲的列表 id
//         */
//       listId: string | null
//       /**
//         * 是否属于 “稍后播放”
//         */
//       isTempPlay: boolean
//     }

//     interface PlayInfo {
//       /**
//        * 当前正在播放歌曲 index
//        */
//       playIndex: number
//       /**
//       * 播放器的播放列表 id
//       */
//       playerListId: string | null
//       /**
//       * 播放器播放歌曲 index
//       */
//       playerPlayIndex: number
//     }

//     interface TempPlayListItem {
//       /**
//        * 播放列表id
//        */
//       listId: string | null
//       /**
//        * 歌曲信息
//        */
//       musicInfo: AnyListen.Music.MusicInfo | AnyListen.Download.ListItem
//       /**
//        * 是否添加到列表顶部
//        */
//       isTop?: boolean
//     }
//   }
// }
