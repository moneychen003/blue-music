declare module '@any-listen/web/lyric-font-player' {
  import type { Line } from '../modules/lyric/store/state'

  interface TimeoutTools {
    setTimeout: (handler: () => void, delay: number) => ReturnType<typeof setTimeout>
    clearTimeout: (timer: ReturnType<typeof setTimeout>) => void
    nextTick: (handler: () => void) => ReturnType<typeof setTimeout>
    cancelNextTick: (timer: ReturnType<typeof setTimeout>) => void
  }

  interface LyricOptions {
    shadowContent?: boolean
    rate?: number
    onPlay?: (line: number, text: string) => void
    onSetLyric?: (lines: Line[], offset: number) => void
    onUpdateLyric?: (lines: Line[]) => void
  }

  export default class Lyric {
    constructor(options: LyricOptions)
    play(currentTime: number): void
    pause(): void
    setOffset(offset: number): void
    setLyric(lyric: string, extendedLyrics?: string[]): void
    setPlaybackRate(rate: number): void
    setTimeoutTools(tools?: TimeoutTools): void
  }
}
