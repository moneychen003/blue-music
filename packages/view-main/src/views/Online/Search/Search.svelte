<script lang="ts">
  import Portal from '@/components/base/Portal.svelte'
  import { urlParamKeyMap, useActiveType, useResourceList, type ViewType } from '../shared.svelte'
  import Tab from '@/components/base/Tab.svelte'
  import { i18n } from '@/plugins/i18n'
  import { query, type Params } from '@/plugins/routes'
  import Music from './Music/Music.svelte'
  import Songlist from './Songlist/Songlist.svelte'
  import Album from './Album/Album.svelte'
  import Singer from './Singer/Singer.svelte'
  import { untrack } from 'svelte'
  import { replaceRoute } from '@/modules/resource/actions'
  import { searchTypes } from './shared.svelte'

  const activeType = useActiveType(searchTypes)
  const resource = useResourceList('search')

  const typeList = $derived.by(() => {
    const musicSourceList = resource.val.musicSearch ?? []
    const visibleTypes = searchTypes.filter((type) => {
      if (type == 'music') return musicSourceList.length > 0
      if (type == 'songlist') return (resource.val.songlistSearch ?? []).length > 0
      if (type == 'album') return musicSourceList.length > 0
      if (type == 'singer') return musicSourceList.length > 0
      return false
    })
    return visibleTypes.map((type) => ({
      id: type,
      label: i18n.t(`online__search_type_${type}`),
    }))
  })

  const to = (queryType: string) => {
    const params: Params = {
      [urlParamKeyMap.type]: 'search' satisfies ViewType,
      [urlParamKeyMap.queryType]: queryType,
    }
    let activeSource = $query[urlParamKeyMap.source] ?? ''
    let text = $query[urlParamKeyMap.query] ?? ''
    if (activeSource) params[urlParamKeyMap.source] = activeSource
    if (text) params[urlParamKeyMap.query] = text
    replaceRoute('/online', params)
  }

  $effect(() => {
    if (!typeList.length) return
    if (activeType.val && typeList.some((s) => s.id == activeType.val)) return
    const s = typeList[0]
    untrack(() => {
      to(s.id)
    })
  })
  // $inspect(resource)
  // $inspect(activeType)
</script>

<Portal to="#online-header-right">
  <Tab
    list={typeList}
    itemkey="id"
    itemlabel="label"
    min
    value={activeType.val}
    onchange={(item) => {
      to(item.id)
    }}
  />
</Portal>

{#if activeType.val == 'music'}
  <Music sourceList={resource.val.musicSearch!} />
{:else if activeType.val == 'songlist'}
  <Songlist sourceList={resource.val.songlistSearch!} />
{:else if activeType.val == 'album'}
  <Album sourceList={resource.val.musicSearch!} />
{:else if activeType.val == 'singer'}
  <Singer sourceList={resource.val.musicSearch!} />
{/if}

<!-- <style lang="less">
.container {

}
</style> -->
