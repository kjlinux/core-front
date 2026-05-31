import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

// Pusher must be on window for Echo to use it
;(window as unknown as { Pusher: unknown }).Pusher = Pusher

let echoInstance: Echo<'reverb'> | null = null
let echoToken: string | null = null

export function initEcho(): Echo<'reverb'> {
  const token = localStorage.getItem('access_token')

  // Ne reutiliser l'instance que si le token n'a pas change. Apres un login, un
  // rafraichissement de token ou une (de)impersonation, le token differe : il faut
  // reconstruire la connexion, sinon le temps reel reste authentifie avec l'ancien token.
  if (echoInstance && echoToken === token) {
    return echoInstance
  }

  if (echoInstance) {
    echoInstance.disconnect()
    echoInstance = null
  }

  echoToken = token

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT) || 8080,
    wssPort: Number(import.meta.env.VITE_REVERB_PORT) || 8080,
    forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
    authEndpoint: `${import.meta.env.VITE_API_BASE_URL}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
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
  echoToken = null
}
