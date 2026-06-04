import { simplify, tranditionalize } from './shared/simplify-chinese-main'

export const langS2T = (rawText: string): string => {
  const text = tranditionalize(rawText)
  return text
}

export const langT2S = (rawText: string): string => {
  const text = simplify(rawText)
  return text
}

// export {
//   saveAnyListenConfigFile,
//   readAnyListenConfigFile,
//   saveStrToFile,
// } from '@common/utils/nodejs'
