import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

// Pusher must be on window for Echo to use it
;(window as any).Pusher = Pusher

let echoInstance: Echo<'reverb'> | null = null

export function initEcho(): Echo<'reverb'> {
  if (echoInstance) return echoInstance

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT) || 8080,
    wssPort: Number(import.meta.env.VITE_REVERB_PORT) || 8080,
    forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
  })

  return echoInstance
}

export function getEcho(): Echo<'reverb'> | null {
  return echoInstance
}

export function disconnectEcho(): void {
  if (echoInstance) {
    echoInstance.disconnect()
    echoInstance = null
  }
}
