import { showNotify } from '@/components/apis/notify'
import {
  downloadAndParseExtension,
  getOnlineExtensionList,
  installExtension,
  updateExtension,
} from '@/modules/extension/store/actions'
import { extensionState } from '@/modules/extension/store/state'
import { i18n } from '@/plugins/i18n'

export const getTargetOnlineExtension = async (id: string) => {
  if (!extensionState.onlineExtensionList.length) await getOnlineExtensionList()
  const targetExt = extensionState.onlineExtensionList.find((e) => e.id == id)
  return targetExt
}
export const install = async (
  ext: AnyListen.IPCExtension.RemoteOnlineDetail | AnyListen.IPCExtension.RemoteOnlineListItem,
  update?: boolean
) => {
  // TODO
  try {
    const tempExt = await downloadAndParseExtension(ext.download_url, ext)
    if (update) {
      await updateExtension(tempExt)
    } else {
      await installExtension(tempExt)
    }
  } catch (error) {
    console.error('Failed to install extension:', error)
    // Show an error message to the user
    showNotify(i18n.t('extension.install_failed', { name: ext.name, err: (error as Error).message }))
    return
  }
  showNotify(i18n.t('extension.install_success', { name: ext.name }))
}

export const installOrUpdate = async (
  ext: AnyListen.Extension.Extension | AnyListen.IPCExtension.OnlineListItem | AnyListen.IPCExtension.RemoteOnlineDetail
) => {
  const targetExt = 'installed' in ext ? ext : await getTargetOnlineExtension(ext.id)
  if (!targetExt) {
    showNotify(i18n.t('extension.install_failed', { name: ext.name, err: i18n.t('extension.not_found_in_online') }))
    return
  }
  await install(targetExt, targetExt.installed)
}
