import crypto from 'node:crypto'

type ApiPermission = NonNullable<AnyListen.Config['apiUsers'][number]['permissions']>[number]

export interface ApiUser {
  username: string
  role: 'admin' | 'reader'
  permissions: ApiPermission[]
}

const DEFAULT_READER_PERMISSIONS: ApiPermission[] = ['library:read', 'library:stream']
const DEFAULT_ADMIN_PERMISSIONS: ApiPermission[] = ['library:read', 'library:stream', 'library:write', 'jobs:run']

const md5 = (text: string) => crypto.createHash('md5').update(text).digest('hex')
const queryValue = (ctx: AnyListen.RequestContext, key: string) => {
  const value = ctx.query[key]
  return Array.isArray(value) ? value[0] : value
}

const getPasswordParam = (ctx: AnyListen.RequestContext) => {
  const rawPassword = queryValue(ctx, 'p')
  if (typeof rawPassword == 'string' && rawPassword.startsWith('enc:')) {
    return Buffer.from(rawPassword.substring(4), 'hex').toString('utf8')
  }
  return typeof rawPassword == 'string' ? rawPassword : ''
}

const checkUserPassword = (ctx: AnyListen.RequestContext, password: string) => {
  const token = queryValue(ctx, 't')
  const salt = queryValue(ctx, 's')
  if (typeof token == 'string' && typeof salt == 'string' && token == md5(`${password}${salt}`)) return true
  return getPasswordParam(ctx) == password
}

export const getApiUser = (ctx: AnyListen.RequestContext): ApiUser | null => {
  const users = global.anylisten.config.apiUsers
  if (!users.length) {
    if (global.anylisten.config.password) return null
    return {
      username: 'default',
      role: 'admin',
      permissions: DEFAULT_ADMIN_PERMISSIONS,
    }
  }

  const username = queryValue(ctx, 'u')
  if (typeof username != 'string') return null
  const user = users.find((item) => item.username == username)
  if (!user || !checkUserPassword(ctx, user.password)) return null

  return {
    username: user.username,
    role: user.role,
    permissions: user.permissions?.length
      ? user.permissions
      : user.role == 'admin'
        ? DEFAULT_ADMIN_PERMISSIONS
        : DEFAULT_READER_PERMISSIONS,
  }
}

export const requireApiPermission = (ctx: AnyListen.RequestContext, permission: ApiPermission) => {
  const user = getApiUser(ctx)
  if (!user || !user.permissions.includes(permission)) {
    ctx.status = 401
    ctx.body = {
      error: 'unauthorized',
    }
    return null
  }
  return user
}
