<script lang="ts">
  import Tab from '@/components/base/Tab.svelte'
  import { query } from '@/plugins/routes'
  import type { SourceType } from '../../../shared.svelte'
  import { songlistUrlParamKeyMap } from '../../shared.svelte'
  import { getData } from '@/modules/resource/songlist/sorts/actions'
  import { extT } from '@/modules/extension/i18n'
  import { replaceRoute } from '@/modules/resource/actions'
  let { source }: { source?: SourceType } = $props()

  let rawList = $state.raw<AnyListen.Resource.TagItem[]>([])
  let listSourceId = ''
  let value = $state('')
  let list = $derived.by(() => {
    if (!source) return rawList
    return rawList.map((item) => {
      return { id: item.id, name: $extT(source.extensionId, item.name) }
    })
  })

  $effect(() => {
    if (!source) return
    const sId = source.sId
    void getData(source.extensionId, source.id).then((list) => {
      if (source.sId != sId) return
      rawList = list
      listSourceId = sId
    })
  })

  $effect(() => {
    if (!source) return
    const sort = $query[songlistUrlParamKeyMap.sort] || ''
    value = sort
    if (!list.length || listSourceId != source.sId || (sort && list.some((s) => s.id == sort))) return
    replaceRoute('/online', { ...$query, [songlistUrlParamKeyMap.sort]: list[0].id })
  })
</script>

<Tab
  {list}
  itemkey="id"
  itemlabel="name"
  {value}
  min
  onchange={(item) => {
    replaceRoute('/online', { ...$query, [songlistUrlParamKeyMap.sort]: item.id })
  }}
/>
