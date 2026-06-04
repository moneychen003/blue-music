import type Router from '@koa/router'

import { parseMusicMetadata, syncUserList, musicListEvent } from '@any-listen/app/modules/musicList'

import { workers } from '@/app/worker'

import { getApiUser, requireApiPermission } from './apiAuth'

type JobStatus = 'queued' | 'running' | 'done' | 'error'
type JobType = 'list-sync' | 'metadata-repair'

interface JobInfo {
  id: string
  type: JobType
  target: string
  status: JobStatus
  createdAt: number
  updatedAt: number
  progress: {
    total: number
    done: number
  }
  message: string
}

const jobs: JobInfo[] = []
const queryValue = (ctx: AnyListen.RequestContext, key: string) => {
  const value = ctx.query[key]
  return Array.isArray(value) ? value[0] : value
}
const createJob = (type: JobType, target: string): JobInfo => {
  const now = Date.now()
  const job = {
    id: `${now}-${Math.random().toString(16).slice(2)}`,
    type,
    target,
    status: 'queued',
    createdAt: now,
    updatedAt: now,
    progress: {
      total: 0,
      done: 0,
    },
    message: '',
  } satisfies JobInfo
  jobs.unshift(job)
  jobs.splice(50)
  return job
}
const runJob = (job: JobInfo, runner: (job: JobInfo) => Promise<void>) => {
  void Promise.resolve()
    .then(async () => {
      job.status = 'running'
      job.updatedAt = Date.now()
      await runner(job)
      job.status = 'done'
      job.updatedAt = Date.now()
    })
    .catch((err: Error) => {
      job.status = 'error'
      job.message = err.message
      job.updatedAt = Date.now()
    })
}
const listIdsForTarget = async (target: string) => {
  const listData = await workers.dbService.getAllUserLists()
  if (target && target != 'all') return [target]
  return listData.userList.filter((listInfo) => listInfo.type === 'local' || listInfo.type === 'remote' || listInfo.type === 'online').map((listInfo) => listInfo.id)
}
const queueListSync = async (target: string) => {
  const job = createJob('list-sync', target || 'all')
  runJob(job, async (runningJob) => {
    const ids = await listIdsForTarget(target)
    runningJob.progress.total = ids.length
    for (const id of ids) {
      await syncUserList(id)
      runningJob.progress.done++
      runningJob.updatedAt = Date.now()
    }
  })
  return job
}
const queueMetadataRepair = async (target: string) => {
  const job = createJob('metadata-repair', target)
  runJob(job, async (runningJob) => {
    const ids = await listIdsForTarget(target)
    const updates: AnyListen.IPCList.ListActionMusicUpdate = []
    for (const listId of ids) {
      const list = await workers.dbService.getListMusics(listId)
      const candidates = list.filter((musicInfo) => {
        return musicInfo.meta.unparsed || !musicInfo.singer.trim() || !musicInfo.meta.albumName.trim() || !musicInfo.interval
      })
      runningJob.progress.total += candidates.length
      for (const musicInfo of candidates) {
        const parsed = await parseMusicMetadata(listId, musicInfo)
        if (parsed) updates.push({ id: listId, musicInfo: parsed })
        runningJob.progress.done++
        runningJob.updatedAt = Date.now()
      }
    }
    if (updates.length) await musicListEvent.list_music_update(updates)
  })
  return job
}

export const registerJobsRouter = (router: Router<unknown, AnyListen.RequestContext>) => {
  router.get('/users/me', async (ctx) => {
    const user = getApiUser(ctx)
    if (!user) {
      ctx.status = 401
      ctx.body = { error: 'unauthorized' }
      return
    }
    ctx.body = {
      user,
      multiUserEnabled: global.anylisten.config.apiUsers.length > 0,
    }
  })

  router.get('/jobs', async (ctx) => {
    if (!global.anylisten.config['apiJobs.enabled']) {
      ctx.status = 404
      return
    }
    if (!requireApiPermission(ctx, 'jobs:run')) return
    ctx.body = {
      jobs,
    }
  })

  router.post('/jobs/sync', async (ctx) => {
    if (!global.anylisten.config['apiJobs.enabled']) {
      ctx.status = 404
      return
    }
    if (!requireApiPermission(ctx, 'jobs:run')) return
    ctx.body = {
      job: await queueListSync(String(queryValue(ctx, 'listId') || 'all')),
    }
  })

  router.post('/jobs/metadata', async (ctx) => {
    if (!global.anylisten.config['apiJobs.enabled']) {
      ctx.status = 404
      return
    }
    if (!requireApiPermission(ctx, 'jobs:run')) return
    ctx.body = {
      job: await queueMetadataRepair(String(queryValue(ctx, 'listId') || 'all')),
    }
  })
}

