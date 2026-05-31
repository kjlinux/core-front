import type { ToastMessage } from '@/types'

/**
 * Sons des toasts : le fichier success-toast.mp3 pour les toasts verts
 * (type "success"), error-toast.mp3 pour tous les autres
 * (error / warning / info).
 *
 * Les fichiers vivent dans core-front/public/ et sont donc servis à la
 * racine ('/success-toast.mp3', '/error-toast.mp3').
 */

let successAudio: HTMLAudioElement | null = null
let errorAudio: HTMLAudioElement | null = null

function getAudio(kind: 'success' | 'error'): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null
    if (kind === 'success') {
        if (!successAudio) {
            successAudio = new Audio('/success-toast.mp3')
            successAudio.volume = 0.5
        }
        return successAudio
    }
    if (!errorAudio) {
        errorAudio = new Audio('/error-toast.mp3')
        errorAudio.volume = 0.5
    }
    return errorAudio
}

function play(kind: 'success' | 'error') {
    const sound = getAudio(kind)
    if (!sound) return
    sound.currentTime = 0
    sound.play().catch(() => {
        // Le navigateur peut bloquer l'autoplay avant toute interaction.
    })
}

/** Toast vert (success) -> success-toast.mp3 ; tout le reste -> error-toast.mp3. */
export function playToastSound(type: ToastMessage['type']) {
    if (type === 'success') play('success')
    else play('error')
}
