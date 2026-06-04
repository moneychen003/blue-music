import type { ComponentProps } from 'svelte'

// import Vue from 'vue'
import type Router from '@/plugins/svelte-spa-router/Router.svelte'
import Collected from '@/views/Collected/index.svelte'
import Download from '@/views/Download/index.svelte'
import Extenstion from '@/views/Extenstion/index.svelte'
import Library from '@/views/Library/index.svelte'
import MediaLibrary from '@/views/MediaLibrary/index.svelte'
import Netease from '@/views/Netease/index.svelte'
import Online from '@/views/Online/index.svelte'
import SonglistDetail from '@/views/Online/Songlist/detail/Detail.svelte'
import TopSongs from '@/views/TopSongs/index.svelte'
import TopSongsDetail from '@/views/Online/TopSongs/detail/Detail.svelte'
import Search from '@/views/Search/index.svelte'
import Setting from '@/views/Setting/index.svelte'

const routes: ComponentProps<typeof Router>['routes'] = {
  '/': Netease,
  '/curated': Netease,
  '/liked': Netease,
  '/recent': Netease,
  '/playlist-detail': Netease,
  '/online': Online,
  '/online/songlist': SonglistDetail,
  '/online/topSongs': TopSongsDetail,
  '/library': Library,
  '/media-library': MediaLibrary,
  '/collected': Collected,
  '/songList/list': Search,
  '/songList/detail': Search,
  '/topSongs': TopSongs,
  '/list': Search,
  '/download': Download,
  '/settings': Setting,
  '/extenstion': Extenstion,
  '*': Netease,
}

// export const query = derived(
//   querystring,
//   (_querystring = '') => {
//     return parseUrlParams(_querystring)
//   },
// )

export default routes

export { getLocation, link, location, push, query, replace, type Params } from '@/plugins/svelte-spa-router/navigator'
