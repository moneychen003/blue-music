import { LIST_IDS } from '@any-listen/common/constants'
import { derived, get, readable } from 'svelte/store'

import { i18n, languageChangeEvent } from '@/plugins/i18n'

import { initListCover, getSubUserLists } from './store/actions'
import { musicLibraryEvent } from './store/event'
import { musicLibraryState } from './store/state'

const getDefaultLists = () => {
  return [
    { ...musicLibraryState.loveList, name: i18n.t('list_name__love') },
    { ...musicLibraryState.defaultList, name: i18n.t('list_name__default') },
  ] as AnyListen.List.MyListInfo[]
}
// const getMyLists = () => {
//   return [
//     ...getDefaultLists(),
//     ...(musicLibraryState.userLists ?? []),
//   ] as AnyListen.List.MyListInfo[]
// }

export const defaultLists = readable(getDefaultLists(), (set) => {
  const handleUpdate = () => {
    set(getDefaultLists())
  }
  handleUpdate()
  const unsub = musicLibraryEvent.on('listChanged', (ids) => {
    if (ids.includes(LIST_IDS.DEFAULT) || ids.includes(LIST_IDS.LOVE)) {
      handleUpdate()
    }
  })
  const unsub2 = languageChangeEvent.on(handleUpdate)

  return function stop() {
    unsub()
    unsub2()
  }
})

export const allUserLists = readable(musicLibraryState.userLists, (set) => {
  const handleUpdate = () => {
    set([...musicLibraryState.userLists])
  }
  handleUpdate()
  const unsub = musicLibraryEvent.on('listSubListChanged', handleUpdate)

  return function stop() {
    unsub()
  }
})

// export const useUserLists = () => {
//   let val = $state<AnyListen.List.MyListInfo[]>(getMyLists())
//   const handleUpdate = () => {
//     val = getMyLists()
//   }
//   const unsub = musicLibraryEvent.on('listChanged', handleUpdate)
//   const unsub2 = onSettingChanged('common.langId', handleUpdate)

//   $effect(() => {
//     return () => {
//       unsub()
//       unsub2()
//     }
//   })
//   return {
//     get val() {
//       return val
//     },
//   }
// }
export const userListsAll = derived([defaultLists, allUserLists], ([defaultLists, allUserLists]) => {
  return [
    ...defaultLists,
    { ...musicLibraryState.lastPlayList, name: i18n.t('list_name__last_play') } satisfies AnyListen.List.MyLastPlayListInfo,
    ...allUserLists,
  ]
})

export const userListInited = readable(musicLibraryState.userListInited, (set) => {
  const handleUpdate = () => {
    set(musicLibraryState.userListInited)
  }
  handleUpdate()
  const unsub = musicLibraryEvent.on('userListInited', handleUpdate)

  return function stop() {
    unsub()
  }
})

export const getUserListsAll = () => get(userListsAll)

// export const useUserListsAll = () => {
//   let userLists = useUserLists()
//   let val = $derived([...userLists.val, { ...musicLibraryState.lastPlayList, name: i18n.t('list_name__last_play') }])
//   return {
//     get val() {
//       return val
//     },
//   }
// }

export const useUserList = (parentId: AnyListen.List.ParentId) => {
  let val = $state(getSubUserLists(parentId))
  const handleUpdate = (ids: AnyListen.List.ParentId[]) => {
    if (!ids.includes(parentId)) return
    val = getSubUserLists(parentId)
  }
  $effect(() => {
    val = getSubUserLists(parentId)
    const unsub = musicLibraryEvent.on('listSubListChanged', handleUpdate)
    return () => {
      unsub()
    }
  })
  return {
    get val() {
      return val
    },
  }
}

export const useFetchingListStatus = (id: string | (() => string) = '') => {
  const getId = () => (typeof id === 'function' ? id() : id)
  let val = $state(musicLibraryState.fetchingListStatus[getId()])
  $effect(() => {
    const currentId = getId()
    val = musicLibraryState.fetchingListStatus[currentId]
    return musicLibraryEvent.on('fetchingListStatusUpdated', (_id) => {
      if (currentId != _id) return
      val = musicLibraryState.fetchingListStatus[_id]
    })
  })
  return {
    get val() {
      return val
    },
  }
}

export const useListCover = (listInfo?: AnyListen.List.MyListInfo | (() => AnyListen.List.MyListInfo | undefined)) => {
  const getListInfo = () => (typeof listInfo === 'function' ? listInfo() : listInfo)
  const initialInfo = getListInfo()
  let val = $state(initialInfo ? initialInfo.meta.pic || musicLibraryState.listCoverMap.get(initialInfo.id) : null)
  $effect(() => {
    const currentInfo = getListInfo()
    if (!currentInfo) {
      val = null
      return
    }
    if (currentInfo.type === 'default') {
      val = currentInfo.meta.pic || musicLibraryState.listCoverMap.get(currentInfo.id) || null
      return
    }
    if (currentInfo.meta.pic) {
      val = currentInfo.meta.pic
      return
    }
    const pic = musicLibraryState.listCoverMap.get(currentInfo.id)
    if (pic) {
      val = pic
    } else {
      val = null
      void initListCover(currentInfo.id)
    }

    const unsub = musicLibraryEvent.on('listCoverUpdated', (_listId, cover) => {
      if (currentInfo.id != _listId) return
      val = cover
    })
    const unsub2 = musicLibraryEvent.on('anyListMusicChanged', (ids) => {
      if (!ids.includes(currentInfo.id)) return
      void initListCover(currentInfo.id)
    })
    return () => {
      unsub()
      unsub2()
    }
  })
  return {
    get val() {
      return val
    },
  }
}
