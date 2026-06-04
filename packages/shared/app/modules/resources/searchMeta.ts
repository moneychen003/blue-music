/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { services } from '../resources/shared'

export const tipSearch = async ({
  extensionId,
  source,
  keyword,
}: {
  extensionId: string
  source: string
  keyword: string
}): Promise<string[]> => {
  return services.extensionSerive
    .resourceAction('tipSearch', {
      extensionId,
      source,
      keyword,
    })
    .then((result) => {
      // console.log(result)
      return result ?? []
    })
}

export const hotSearch = async ({ extensionId, source }: { extensionId: string; source: string }): Promise<string[]> => {
  return services.extensionSerive
    .resourceAction('hotSearch', {
      extensionId,
      source,
    })
    .then((result) => {
      // console.log(result)
      return result ?? []
    })
}
