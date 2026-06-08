/**
 * Adaptateur axios du mode démo.
 *
 * Remplace le transport HTTP de l'instance axios par un routeur local qui sert
 * les données factices en mémoire. Installé uniquement quand le mode démo est
 * actif (cf. client.ts). Tout le reste de l'application (stores, pages, API)
 * fonctionne sans modification.
 */
import type { AxiosAdapter, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { handleRequest, keysToCamel, NOT_FOUND, type DemoRequest } from './handlers'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dict = Record<string, any>

function cleanPath(url: string | undefined, baseURL: string | undefined): string {
  let path = url ?? ''
  if (baseURL && path.startsWith(baseURL)) path = path.slice(baseURL.length)
  // retire un éventuel domaine absolu
  path = path.replace(/^https?:\/\/[^/]+/, '')
  // retire le préfixe /api et les slashs de bord
  path = path.replace(/^\/?api\//, '/').replace(/^\/+/, '').replace(/\/+$/, '')
  // retire une éventuelle query résiduelle
  const q = path.indexOf('?')
  if (q >= 0) path = path.slice(0, q)
  return path
}

function parseBody(data: unknown): Dict {
  if (!data) return {}
  if (typeof FormData !== 'undefined' && data instanceof FormData) {
    const obj: Dict = {}
    data.forEach((value, key) => {
      obj[key] = value
    })
    return keysToCamel(obj) as Dict
  }
  if (typeof data === 'string') {
    try {
      return keysToCamel(JSON.parse(data)) as Dict
    } catch {
      return {}
    }
  }
  if (typeof data === 'object') {
    return keysToCamel(data) as Dict
  }
  return {}
}

function parseParams(params: unknown): Dict {
  if (!params || typeof params !== 'object') return {}
  const camel = keysToCamel(params) as Dict
  // _company_id devient companyId via keysToCamel (CompanyId). On normalise.
  if (camel.CompanyId !== undefined && camel.companyId === undefined) {
    camel.companyId = camel.CompanyId
  }
  delete camel.CompanyId
  return camel
}

const demoAdapter: AxiosAdapter = (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
  const method = (config.method ?? 'get').toLowerCase()
  const path = cleanPath(config.url, config.baseURL)
  const req: DemoRequest = {
    method,
    path,
    params: parseParams(config.params),
    body: parseBody(config.data),
  }

  const makeResponse = (data: unknown, status = 200): AxiosResponse => ({
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {},
    config,
  })

  return new Promise((resolve, reject) => {
    // Latence simulée pour un rendu réaliste (spinners, transitions).
    setTimeout(() => {
      try {
        const result = handleRequest(req)
        if (result === NOT_FOUND) {
          reject({
            config,
            response: makeResponse({ message: 'Ressource introuvable (demo)' }, 404),
            message: 'Ressource introuvable (demo)',
            isDemoError: true,
          })
          return
        }
        resolve(makeResponse(result))
      } catch (err) {
        // En démo, on ne casse jamais l'UI : on renvoie une réponse vide.
        console.warn('[demo] erreur handler, reponse vide', req, err)
        resolve(makeResponse({}))
      }
    }, 120)
  })
}

/** Installe l'adaptateur démo sur l'instance axios fournie. */
export function installDemoAdapter(client: AxiosInstance): void {
  client.defaults.adapter = demoAdapter
}
