import defaultSetting from './defaultClientSetting'

const config: AnyListen.Config = {
  port: '9500', // 绑定的端口
  bindIp: '127.0.0.1', // 要绑定的IP， 0.0.0.0 接受所有IP的请求

  httpLog: true, // 是否启用 HTTP 请求日志记录

  'cors.enabled': false, // 是否启用跨域功能
  'cors.whitelist': [
    // 允许跨域的域名， 空数组则允许所有域名跨域
    // 'www.xxx.com',
  ],

  serverName: '',

  'upstreamProxy.enabled': false,
  'upstreamProxy.header': '',

  'extension.ghMirrorHosts': defaultSetting['extension.ghMirrorHosts'].split('\n'), // 扩展的镜像站点

  httpProxy: '', // 代理服务器地址，例子 `127.0.0.1:2080`

  apiUsers: [],
  'apiJobs.enabled': true,

  allowPublicDir: [],
  password: '',
}

export default config
