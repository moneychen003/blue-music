declare namespace AnyListen {
  interface Config {
    /**
     * 绑定的端口
     */
    port: string
    /**
     * 要绑定的IP， 0.0.0.0 接受所有IP的请求
     */
    bindIp: string
    /**
     * 是否启用 HTTP 请求日志记录
     */
    httpLog: boolean
    /**
     * 是否启用跨域功能
     */
    'cors.enabled': boolean
    /**
     * 允许跨域的域名，空数组则允许所有域名跨域
     */
    'cors.whitelist': string[]

    /**
     * 服务名称
     */
    serverName: string

    /**
     * 是否使用代理转发请求到本服务器
     */
    'upstreamProxy.enabled': boolean

    /**
     * 代理转发的请求头
     */
    'upstreamProxy.header': string

    /**
     * 扩展的 github 镜像站点地址列表
     */
    'extension.ghMirrorHosts': string[]

    /**
     * 代理服务器
     */
    httpProxy: string

    /**
     * REST / Subsonic API users
     */
    apiUsers: Array<{
      username: string
      password: string
      role: 'admin' | 'reader'
      permissions?: Array<'library:read' | 'library:stream' | 'library:write' | 'jobs:run'>
    }>

    /**
     * Whether background jobs REST endpoints are enabled
     */
    'apiJobs.enabled': boolean

    /**
     * 允许选择的系统路径范围
     */
    allowPublicDir: string[]

    /**
     * 登录密码
     */
    password: string
  }
}
