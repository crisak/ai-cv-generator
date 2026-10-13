import type { Instrumentation } from 'next'

// Registra en Vercel cualquier error no capturado del servidor (rutas, server components, proxy).
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const { logger } = await import('@/lib/logger')
  logger.error('server.unhandled_error', error, {
    path: request.path,
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
    routerKind: context.routerKind,
    renderSource: context.renderSource,
  })
}
