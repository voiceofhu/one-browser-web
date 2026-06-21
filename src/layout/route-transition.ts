type RouteTransitionListener = (routeKey: string) => void

const completeListeners = new Set<RouteTransitionListener>()

export function notifyRouteTransitionComplete(routeKey: string) {
  completeListeners.forEach((listener) => listener(routeKey))
}

export function subscribeRouteTransitionComplete(
  listener: RouteTransitionListener
) {
  completeListeners.add(listener)

  return () => {
    completeListeners.delete(listener)
  }
}
