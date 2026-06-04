declare namespace AnyListen {
  namespace DesktopLyric {
    interface Config {
      'desktopLyric.enable': AnyListen.AppSetting['desktopLyric.enable']
      'desktopLyric.isLock': AnyListen.AppSetting['desktopLyric.isLock']
      'desktopLyric.isAlwaysOnTop': AnyListen.AppSetting['desktopLyric.isAlwaysOnTop']
      'desktopLyric.isAlwaysOnTopLoop': AnyListen.AppSetting['desktopLyric.isAlwaysOnTopLoop']
      'desktopLyric.isShowTaskbar': AnyListen.AppSetting['desktopLyric.isShowTaskbar']
      'desktopLyric.audioVisualization': AnyListen.AppSetting['desktopLyric.audioVisualization']
      'desktopLyric.width': AnyListen.AppSetting['desktopLyric.width']
      'desktopLyric.height': AnyListen.AppSetting['desktopLyric.height']
      'desktopLyric.x': AnyListen.AppSetting['desktopLyric.x']
      'desktopLyric.y': AnyListen.AppSetting['desktopLyric.y']
      'desktopLyric.isLockScreen': AnyListen.AppSetting['desktopLyric.isLockScreen']
      'desktopLyric.isDelayScroll': AnyListen.AppSetting['desktopLyric.isDelayScroll']
      'desktopLyric.scrollAlign': AnyListen.AppSetting['desktopLyric.scrollAlign']
      'desktopLyric.isHoverHide': AnyListen.AppSetting['desktopLyric.isHoverHide']
      'desktopLyric.direction': AnyListen.AppSetting['desktopLyric.direction']
      'desktopLyric.style.align': AnyListen.AppSetting['desktopLyric.style.align']
      'desktopLyric.style.font': AnyListen.AppSetting['desktopLyric.style.font']
      'desktopLyric.style.fontSize': AnyListen.AppSetting['desktopLyric.style.fontSize']
      'desktopLyric.style.lineGap': AnyListen.AppSetting['desktopLyric.style.lineGap']
      'desktopLyric.style.lyricUnplayColor': AnyListen.AppSetting['desktopLyric.style.lyricUnplayColor']
      'desktopLyric.style.lyricPlayedColor': AnyListen.AppSetting['desktopLyric.style.lyricPlayedColor']
      'desktopLyric.style.lyricShadowColor': AnyListen.AppSetting['desktopLyric.style.lyricShadowColor']
      // 'desktopLyric.style.fontWeight': AnyListen.AppSetting['desktopLyric.style.fontWeight']
      'desktopLyric.style.opacity': AnyListen.AppSetting['desktopLyric.style.opacity']
      'desktopLyric.style.ellipsis': AnyListen.AppSetting['desktopLyric.style.ellipsis']
      'desktopLyric.style.isFontWeightFont': AnyListen.AppSetting['desktopLyric.style.isFontWeightFont']
      'desktopLyric.style.isFontWeightLine': AnyListen.AppSetting['desktopLyric.style.isFontWeightLine']
      'desktopLyric.style.isFontWeightExtended': AnyListen.AppSetting['desktopLyric.style.isFontWeightExtended']
      'desktopLyric.style.isZoomActiveLrc': AnyListen.AppSetting['desktopLyric.style.isZoomActiveLrc']
      'common.langId': AnyListen.AppSetting['common.langId']
      'player.isShowLyricTranslation': AnyListen.AppSetting['player.isShowLyricTranslation']
      'player.isShowLyricRoma': AnyListen.AppSetting['player.isShowLyricRoma']
      'player.isSwapLyricTranslationAndRoma': AnyListen.AppSetting['player.isSwapLyricTranslationAndRoma']
      'player.isPlayAwlrc': AnyListen.AppSetting['player.isPlayAwlrc']
      'player.playbackRate': AnyListen.AppSetting['player.playbackRate']
    }

    type ViewMainActions = 'get_info' | 'get_status' | 'get_analyser_data_array'

    interface LyricActionBase<A> {
      action: A
    }
    interface LyricActionData<A, D> extends LyricActionBase<A> {
      data: D
    }
    type LyricAction<A, D = undefined> = D extends undefined ? LyricActionBase<A> : LyricActionData<A, D>

    type LyricActions =
      | LyricAction<
          'set_info',
          {
            id: string | null
            singer: string
            name: string
            album: string
            lrc: string | null
            tlrc: string | null
            rlrc: string | null
            awlrc: string | null
            // pic: string | null
            isPlay: boolean
            line: number
            played_time: number
          }
        >
      | LyricAction<
          'set_status',
          {
            isPlay: boolean
            line: number
            played_time: number
          }
        >
      | LyricAction<
          'set_lyric',
          {
            lrc: string | null
            tlrc: string | null
            rlrc: string | null
            awlrc: string | null
          }
        >
      | LyricAction<'set_offset', number>
      | LyricAction<'set_playbackRate', number>
      | LyricAction<'set_play', number>
      | LyricAction<'set_pause'>
      | LyricAction<'set_stop'>
      | LyricAction<'send_analyser_data_array', Uint8Array>

    interface NewBounds {
      x: number
      y: number
      w: number
      h: number
    }
  }
}
