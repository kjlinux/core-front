let audio: HTMLAudioElement | null = null

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio('/notification.mp3')
    audio.volume = 0.5
  }
  return audio
}

export function useNotificationSound() {
  function play() {
    const sound = getAudio()
    sound.currentTime = 0
    sound.play().catch(() => {
      // Browser may block autoplay before user interaction
    })
  }

  return { play }
}
