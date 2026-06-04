import { type Options, request, type Response } from './request'

const jsdelivrHost = {
  hosts: [
    'https://cdn.jsdelivr.net',
    'https://fastly.jsdelivr.net',
    'https://gcore.jsdelivr.net',
    // 'https://cdn.jsdmirror.com',
    // 'https://cdn.jsdmirror.cn',
    // 'https://jsdelivr.aby.pub',
    // 'https://jsdelivr.qaq.qa',
  ],
  build() {
    return this.hosts.map((host) => {
      return {
        host,
        parseInfo(url: string) {
          url = url.replace(this.host, '')
          const match = /^\/gh\/([^/]+)\/([^/]+)@([^/]+)(.*)/.exec(url)
          if (!match) return null
          return {
            user: match[1],
            repo: match[2],
            version: match[3],
            path: match[4],
          }
        },
        getUrl(user: string, repo: string, version: string, path: string) {
          return `${this.host}/gh/${user}/${repo}@${version}${path}`
        },
      }
    })
  },
}

const rawHosts = [
  {
    host: 'https://raw.githubusercontent.com',
    parseInfo(url: string) {
      const match = /https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)(.*)/.exec(url)
      if (!match) return null
      return {
        user: match[1],
        repo: match[2],
        version: match[3],
        path: match[4],
      }
    },
    getUrl(user: string, repo: string, version: string, path: string) {
      return `${this.host}/${user}/${repo}/${version}${path}`
    },
  },
  ...jsdelivrHost.build(),
]

const releaseHost = [
  {
    host: 'https://github.com',
    parseInfo(url: string) {
      const match = /https:\/\/github\.com\/([^/]+)\/([^/]+)\/releases\/download\/([^/]+)\/(.*)/.exec(url)
      if (!match) return null
      return {
        user: match[1],
        repo: match[2],
        version: match[3],
        name: match[4],
      }
    },
    getUrl(user: string, repo: string, version: string, name: string) {
      return `${this.host}/${user}/${repo}/releases/download/${version}/${name}`
    },
  },
]

const ghProxy = {
  hosts: [] as string[],
  allowHosts: ['https://raw.githubusercontent.com', 'https://github.com'],
  getUrl(url: string) {
    if (![...this.allowHosts, ...this.hosts].some((host) => url.startsWith(`${host}/`))) return null
    let idx = this.hosts.findIndex((host) => url.startsWith(`${host}/`))
    const host = this.hosts[idx + 1]
    if (!host) return null
    let oldHost = this.hosts[idx] ?? ''
    return `${host}/${url.replace(oldHost, '')}`
  },
}
// export const getGhProxy = () => {
//   return ghProxy.hosts
// }
export const setGHMirrorHosts = (hosts: string) => {
  ghProxy.hosts = hosts.split('\n')
}

const getMirrorUrl = (url: string) => {
  let idx = rawHosts.findIndex((host) => url.startsWith(`${host.host}/`))
  if (idx > -1) {
    const host = rawHosts[idx]
    const info = host.parseInfo(url)
    if (!info) return null
    return rawHosts[idx + 1]?.getUrl(info.user, info.repo, info.version, info.path)
  }
  idx = releaseHost.findIndex((host) => url.startsWith(`${host.host}/`))
  if (idx > -1) {
    const host = releaseHost[idx]
    const info = host.parseInfo(url)
    if (!info) return null
    return releaseHost[idx + 1]?.getUrl(info.user, info.repo, info.version, info.name)
  }
  return null
}

const getGhProxyUrl = (url: string) => {
  return ghProxy.getUrl(url)
}

export const eachMirror = async <T = unknown>(
  type: 'ghProxy' | 'mirror' | null,
  rawUrl: string,
  url: string,
  request: (url: string) => Promise<T>
): Promise<T> => {
  return request(url).catch(async (err) => {
    if (type === null || type === 'ghProxy') {
      let newUrl = getGhProxyUrl(url)
      if (newUrl) {
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (import.meta.env.DEV) {
          console.warn(`Request failed, trying mirror: ${url} -> ${newUrl}`)
        }
        return eachMirror<T>('ghProxy', rawUrl, newUrl, request)
      }
      url = rawUrl // Reset to original URL if no gh-proxy found
    }
    let newUrl = getMirrorUrl(url)
    if (newUrl) {
      // @ts-expect-error
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (import.meta.env.DEV) {
        console.warn(`Request failed, trying mirror: ${url} -> ${newUrl}`)
      }
      return eachMirror<T>('mirror', rawUrl, newUrl, request)
    }
    throw err
  })
}

export const mirrorRequest = async <T = unknown>(url: string, options?: Options): Promise<Response<T>> => {
  return eachMirror<Response<T>>(null, url, url, async (url) => {
    return request<T>(url, options)
  })
}
