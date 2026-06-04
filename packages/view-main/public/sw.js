// 注意:历史版本(any-listen-shell-v2)的 sw.js 会在 activate 时
//   unregister 自己 + client.navigate(刷新窗口),
// 而 index.html 每次加载又重新注册 /sw.js,
// 形成 注册→激活→注销+刷新→再注册 的无限刷新死循环(表现为页面"一直转圈/Loading")。
//
// 这个版本只做无害的事:接管控制权 + 清掉所有历史缓存,
// 不拦截任何请求、不触发刷新、不自我注销,从而彻底打破死循环。
const CACHE_NAME = 'blue-music-noop-v3'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys()
        await Promise.all(keys.map((key) => caches.delete(key)))
      } catch {}
      await self.clients.claim()
    })()
  )
})

// 故意不监听 fetch:所有请求都走浏览器原生网络,不缓存、不拦截。
