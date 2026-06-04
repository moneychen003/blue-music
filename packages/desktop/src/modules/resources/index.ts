import { initResources as initResourcesModule } from '@any-listen/app/modules/resources'

import { workers } from '@/worker'

export const initResources = async () => {
  initResourcesModule(workers.extensionService)
}
