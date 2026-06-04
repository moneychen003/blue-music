<script lang="ts">
  import Tab from '@/components/base/Tab.svelte'
  import { i18n } from '@/plugins/i18n'
  import { tabIcons, viewResourceMap, viewTypes, urlParamKeyMap, type ViewType } from './shared.svelte'
  import { resourceList } from '@/modules/extension/reactive.svelte'
  import { pushRoute } from '@/modules/resource/actions'
  import { query } from '@/plugins/routes'

  let { activeview }: { activeview: (typeof viewTypes)[number] } = $props()
  type TabId = ViewType | 'searchSinger' | 'searchAlbum'
  type OnlineTab = {
    id: TabId
    icon: string
    label: string
    type: ViewType
    queryType?: 'singer' | 'album'
  }
  const typeList = $derived.by(() => {
    const res = Object.keys($resourceList.resources) as AnyListen.Extension.ResourceAction[]
    const list: OnlineTab[] = []
    const hasMusicSearch = res.includes('musicSearch')
    for (const t of viewTypes) {
      if (t == 'singer') {
        if (hasMusicSearch) {
          list.push({
            id: 'searchSinger',
            icon: tabIcons.singer,
            label: i18n.t('online__type_singer'),
            type: 'search',
            queryType: 'singer',
          })
        }
        continue
      }
      if (t == 'album') {
        if (hasMusicSearch) {
          list.push({
            id: 'searchAlbum',
            icon: tabIcons.album,
            label: i18n.t('online__type_album'),
            type: 'search',
            queryType: 'album',
          })
        }
        continue
      }
      if (!viewResourceMap[t].some((r) => res.includes(r))) continue
      list.push({ id: t, icon: tabIcons[t], label: i18n.t(`online__type_${t}`), type: t })
    }
    return list
  })
  const activeTab = $derived<TabId>(
    activeview == 'search' && $query[urlParamKeyMap.queryType] == 'singer'
      ? 'searchSinger'
      : activeview == 'search' && $query[urlParamKeyMap.queryType] == 'album'
        ? 'searchAlbum'
        : activeview
  )

  const to = (item: OnlineTab) => {
    const params = { ...$query, [urlParamKeyMap.type]: item.type }
    delete params[urlParamKeyMap.page]
    if (item.queryType) {
      params[urlParamKeyMap.queryType] = item.queryType
    } else if (item.type == 'search') {
      params[urlParamKeyMap.queryType] = 'music'
    } else if (item.type != 'search') {
      delete params[urlParamKeyMap.queryType]
      delete params[urlParamKeyMap.source]
    }
    pushRoute('/online', params)
  }
</script>

<header class="header">
  <Tab
    list={typeList}
    itemkey="id"
    itemlabel="label"
    itemicon="icon"
    value={activeTab}
    min
    onchange={(item) => {
      to(item)
    }}
  />
  <div id="online-header-right"></div>
</header>

<style lang="less">
  .header {
    display: flex;
    flex: none;
    flex-flow: row nowrap;
    align-items: center;
    justify-content: space-between;
    padding: 0 15px;
    // padding: 8px 0;
    // background-color: var(--color-primary-light-400-alpha-800);
    // border-radius: @radius-border;

    // h2 {
    //   font-size: 18px;
    //   padding: 0 15px;
    // }
  }
</style>
