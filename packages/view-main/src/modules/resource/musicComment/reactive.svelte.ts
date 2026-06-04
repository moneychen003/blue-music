import { getSourceId } from '@any-listen/common/tools'

import { extensionEvent } from '@/modules/extension/store/event'
import { extensionState } from '@/modules/extension/store/state'

export const useCommentSources = () => {
  const buildCommentSources = (): AnyListen.IPCResource.SourceItem[] => {
    const res = extensionState.resourceList.resources
    const searchSources = res.musicSearch ?? []
    const commentSources = res.musicComment ?? []
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const supportSources = new Set<string>()
    for (const s of commentSources ?? []) supportSources.add(s.id)
    const sources = searchSources.filter((s) => supportSources.has(s.id))
    return sources.map((s) => ({
      ...s,
      sId: getSourceId(s),
    }))
  }
  let list = $state.raw(buildCommentSources())

  $effect(() => {
    list = buildCommentSources()
    return extensionEvent.on('resourceListUpdated', () => {
      list = buildCommentSources()
    })
  })

  return {
    get val() {
      return list
    },
  }
}
