import { compareVersions } from '@any-listen/common/utils'

export const migrateSetting = (setting: Record<string, unknown>): Partial<AnyListen.AppSetting> => {
  setting = { ...setting }

  setting['extension.ghMirrorHosts'] = global.anylisten.config['extension.ghMirrorHosts'].join('\n')
  if (global.anylisten.config.httpProxy) {
    const [host, port] = global.anylisten.config.httpProxy.split(':')
    setting['network.proxy.enable'] = true
    setting['network.proxy.host'] = host
    setting['network.proxy.port'] = port || '80'
  } else {
    setting['network.proxy.enable'] = false
    setting['network.proxy.host'] = ''
    setting['network.proxy.port'] = ''
  }

  if (compareVersions(setting.version as string, '1.0.1') < 0) {
    setting.version = '1.0.1'
    if (setting['common.playBarProgressStyle'] == 'mini') setting['common.playBarProgressStyle'] = 'centerControl'
    if (setting['playDetail.style.fontSize'] == 120) setting['playDetail.style.fontSize'] = 100
    if (setting['playDetail.style.align'] == 'center') setting['playDetail.style.align'] = 'left'
    setting['playDetail.isDynamicBackground'] ||= true
  }
  if (compareVersions(setting.version as string, '1.0.2') < 0) {
    setting.version = '1.0.2'
    setting['player.isPlayAwlrc'] ||= true
    setting['player.isSavePlayTime'] ||= true
  }
  // TODO
  // setting['playDetail.isZoomActiveLrc'] ||= true

  return setting
}
