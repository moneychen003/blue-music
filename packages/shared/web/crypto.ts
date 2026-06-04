import { sha256 } from 'js-sha256'

export const toSha256 = (str: string | Uint8Array) => {
  return sha256(str)
}
