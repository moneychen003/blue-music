const timeFieldExp = /^(?:\[[\d:.]+\])+/g
const timeExp = /\d{1,3}(:\d{1,3}){0,2}(?:\.\d{1,3})/g

const tRxp1 = /^0+(\d+)/
const tRxp2 = /:0+(\d+)/g
const tRxp3 = /\.0+(\d+)/
const formatTimeLabel = (label: string) => {
  return label.replace(tRxp1, '$1').replace(tRxp2, ':$1').replace(tRxp3, '.$1')
}

const filterExtendedLyricLabel = (lrcTimeLabels: Set<string>, extendedLyric: string) => {
  const extendedLines = extendedLyric.split(/\r\n|\n|\r/)
  const lines: string[] = []
  for (let line of extendedLines) {
    line = line.trim()
    let result = timeFieldExp.exec(line)
    if (!result) continue

    const timeField = result[0]
    const text = line.replace(timeFieldExp, '').trim()
    if (!text) continue
    let times = timeField.match(timeExp)
    if (times == null) continue

    const newTimes = times.filter((time) => {
      const timeStr = formatTimeLabel(time)
      return lrcTimeLabels.has(timeStr)
    })
    if (newTimes.length != times.length) {
      if (!newTimes.length) continue
      line = `[${newTimes.join('][')}]${text}`
    }
    lines.push(line)
  }

  return lines.join('\n')
}

const parseLrcTimeLabel = (lrc: string) => {
  const lines = lrc.split(/\r\n|\n|\r/)
  const linesSet = new Set<string>()
  const length = lines.length
  for (let i = 0; i < length; i++) {
    const line = lines[i].trim()
    let result = timeFieldExp.exec(line)
    if (result) {
      const timeField = result[0]
      const text = line.replace(timeFieldExp, '').trim()
      if (text) {
        const times = timeField.match(timeExp)
        if (times == null) continue
        for (let time of times) {
          linesSet.add(formatTimeLabel(time))
        }
      }
    }
  }

  return linesSet
}

const buildAwlyric = (lrcData: AnyListen.Music.LyricInfo) => {
  let lrc: string[] = []
  if (lrcData.lyric) {
    lrc.push(`lrc:${Buffer.from(lrcData.lyric.trim(), 'utf-8').toString('base64')}`)
  }
  if (lrcData.tlyric) {
    lrc.push(`tlrc:${Buffer.from(lrcData.tlyric.trim(), 'utf-8').toString('base64')}`)
  }
  if (lrcData.rlyric) {
    lrc.push(`rlrc:${Buffer.from(lrcData.rlyric.trim(), 'utf-8').toString('base64')}`)
  }
  if (lrcData.awlyric) {
    lrc.push(`awlrc:${Buffer.from(lrcData.awlyric.trim(), 'utf-8').toString('base64')}`)
  }
  return lrc.length ? `[awlrc:${lrc.join(',')}]` : ''
}

export const buildLyrics = (
  lrcData: AnyListen.Music.LyricInfo,
  downloadAwlrc: boolean,
  downloadTlrc: boolean,
  downloadRlrc: boolean
) => {
  if (!lrcData.tlyric && !lrcData.rlyric && !lrcData.awlyric) return lrcData.lyric

  const lrcTimeLabels = parseLrcTimeLabel(lrcData.lyric)

  let lrc = lrcData.lyric
  if (downloadTlrc && lrcData.tlyric) {
    lrc = `${lrc.trim()}\n\n${filterExtendedLyricLabel(lrcTimeLabels, lrcData.tlyric)}\n`
  }
  if (downloadRlrc && lrcData.rlyric) {
    lrc = `${lrc.trim()}\n\n${filterExtendedLyricLabel(lrcTimeLabels, lrcData.rlyric)}\n`
  }
  if (downloadAwlrc) {
    const awlrc = buildAwlyric(lrcData)
    if (awlrc) lrc = `${lrc.trim()}\n\n${awlrc}\n`
  }
  return lrc
}

export const parseLyrics = (lrc: string): Pick<AnyListen.Music.LyricInfo, 'awlyric' | 'lyric' | 'rlyric' | 'tlyric'> => {
  const verifyAwlrc = (lrc: string) => {
    return /(?:^|\s*)\[\d+:\d+(?:\.\d+)]<\d+,\d+>.+$/m.test(lrc)
  }
  const verifylrc = (lrc: string) => {
    return /(?:^|\s*)\[\d+:\d+(?:\.\d+)].+$/m.test(lrc)
  }
  const lrcTags = {
    awlrc: {
      name: 'awlyric',
      verify: verifyAwlrc,
    },
    lrc: {
      name: 'lyric',
      verify: verifylrc,
    },
    tlrc: {
      name: 'tlyric',
      verify: verifylrc,
    },
    rlrc: {
      name: 'rlyric',
      verify: verifylrc,
    },
  } as const
  const tagRxp = /(?:^|\n\s*)\[awlrc:([^\]]+)]/i
  const lrcRxp = /^(lrc|awlrc|tlrc|rlrc):([^,]+)$/i
  const parse = (content: string) => {
    const lyricInfo: Partial<AnyListen.Music.LyricInfo> = {}
    const lrcs = content.trim().split(',')
    for (const lrc of lrcs) {
      const result = lrcRxp.exec(lrc.trim())
      if (!result) continue
      const target = lrcTags[result[1].toLowerCase() as 'awlrc' | 'tlrc' | 'rlrc' | 'lrc']
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!target) continue
      const data = Buffer.from(result[2], 'base64').toString('utf-8').trim()
      if (target.verify(data)) lyricInfo[target.name] = data
    }
    return lyricInfo
  }
  let parsedInfo: Partial<AnyListen.Music.LyricInfo> = {}
  let lyric = lrc
    .replace(tagRxp, (_: string, p1: string) => {
      parsedInfo = parse(p1)
      return ''
    })
    .trim()
  return { lyric, ...parsedInfo }
}
