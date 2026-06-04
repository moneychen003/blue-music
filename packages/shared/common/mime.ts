import mime from 'mime'

export const getMimeType = (filepath: string) => {
  return mime.getType(filepath) ?? 'application/octet-stream'
}
