/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { services } from '../resources/shared'

export const musicComment = async ({
  extensionId,
  source,
  musicInfo,
  type,
  id,
  page,
  limit,
}: {
  extensionId: string
  source: string
  musicInfo: AnyListen.Music.MusicInfoOnline
  type: AnyListen.IPCExtension.MusicCommentParams['type']
  id?: string
  page: number
  limit?: number
}): Promise<AnyListen.IPCResource.MusicCommentResult> => {
  return services.extensionSerive
    .resourceAction('musicComment', {
      extensionId,
      source,
      musicInfo,
      type,
      limit,
      page,
      id,
    })
    .then((result) => {
      // console.log(result)
      return {
        list: result.list ?? [],
        total: result.total,
        limit: result.limit ?? 30,
        page: result.page ?? 1,
      }
    })
}
