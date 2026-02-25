import { onUnmounted } from 'vue'
import { getEcho } from '@/services/echo'

type CleanupFn = () => void

/**
 * Composable to subscribe to Echo channels in a Vue component.
 * Automatically leaves channels on component unmount.
 */
export function useRealtime() {
  const cleanups: CleanupFn[] = []

  function listenOnChannel<T>(channelName: string, eventName: string, callback: (data: T) => void) {
    const echo = getEcho()
    if (!echo) return

    echo.channel(channelName).listen(`.${eventName}`, callback)

    cleanups.push(() => {
      echo.leave(channelName)
    })
  }

  function stopListening() {
    cleanups.forEach((fn) => fn())
    cleanups.length = 0
  }

  onUnmounted(() => {
    stopListening()
  })

  return { listenOnChannel, stopListening }
}
