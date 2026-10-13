type Level = 'info' | 'warn' | 'error'

const SENSITIVE_KEY = /api[-_]?key|authorization|token|secret|password|cookie/i
const MAX_STRING = 500

function redact(value: unknown, depth = 0): unknown {
  if (typeof value === 'string') {
    return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}…[+${value.length - MAX_STRING}]` : value
  }
  if (value === null || typeof value !== 'object' || depth > 4) return value
  if (Array.isArray(value)) return value.slice(0, 20).map((v) => redact(v, depth + 1))
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [k, SENSITIVE_KEY.test(k) ? '[REDACTED]' : redact(v, depth + 1)]),
  )
}

export function serializeError(error: unknown): Record<string, unknown> {
  if (!(error instanceof Error)) return { message: String(error) }
  const { code, details } = error as Error & { code?: unknown; details?: unknown }
  return {
    name: error.name,
    message: error.message,
    code,
    details: redact(details),
    stack: error.stack,
    cause: error.cause ? serializeError(error.cause) : undefined,
  }
}

function emit(level: Level, event: string, fields: Record<string, unknown> = {}) {
  const line = JSON.stringify({ level, event, ts: new Date().toISOString(), ...(redact(fields) as object) })
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export const logger = {
  info: (event: string, fields?: Record<string, unknown>) => emit('info', event, fields),
  warn: (event: string, fields?: Record<string, unknown>) => emit('warn', event, fields),
  error: (event: string, error: unknown, fields?: Record<string, unknown>) =>
    emit('error', event, { ...fields, error: serializeError(error) }),
}

/** Contexto común de request para correlacionar logs (x-vercel-id enlaza con los logs de Vercel). */
export function requestContext(request: Request, route: string, userId?: string | null) {
  return {
    route,
    method: request.method,
    path: new URL(request.url).pathname,
    requestId: request.headers.get('x-vercel-id') ?? request.headers.get('x-request-id') ?? undefined,
    userId: userId ?? undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
  }
}
