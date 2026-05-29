import apiClient from './client'

/**
 * Télécharge un fichier binaire serveur (CSV/PDF) en blob et déclenche le
 * téléchargement navigateur. On passe par axios (avec ses intercepteurs auth)
 * plutôt que par window.location, ce qui attache le token Sanctum et gère le CORS.
 */
export async function downloadServerFile(
  path: string,
  params: Record<string, unknown>,
  fallbackFilename: string,
  mimeType: string,
): Promise<void> {
  const response = await apiClient.get(path, {
    params,
    responseType: 'blob',
    transformResponse: (r) => r,
  })

  const blob = response.data instanceof Blob
    ? response.data
    : new Blob([response.data as BlobPart], { type: mimeType })

  const cd = response.headers?.['content-disposition'] as string | undefined
  const match = cd?.match(/filename="?([^";]+)"?/i)
  const filename = match?.[1] ?? fallbackFilename

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function downloadServerCsv(
  path: string,
  params: Record<string, unknown>,
  fallbackFilename: string,
): Promise<void> {
  return downloadServerFile(path, params, fallbackFilename, 'text/csv;charset=utf-8')
}
