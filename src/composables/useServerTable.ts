import { reactive, ref, watch, type Ref } from 'vue'
import { useDebounceFn } from '@vueuse/core'

/**
 * Paramètres transmis au fetcher : les filtres métier de la page + la pagination + la recherche.
 */
export type ServerTableParams<F> = F & {
  page: number
  perPage: number
  search: string
}

export interface ServerTableOptions<F> {
  /** Filtres métier propres à la page (ex: { status: '', companyId: '' }), hors page/perPage/search. */
  initialFilters: F
  /** Charge les données : typiquement un appel store.fetchX(...). Reçoit filtres + pagination + recherche. */
  fetcher: (params: ServerTableParams<F>) => void | Promise<void>
  /** Items par page (défaut 15, aligné sur le défaut backend). */
  perPage?: number
  /** Délai du débounce de la recherche en ms (défaut 400). */
  debounce?: number
}

export interface ServerTable<F> {
  /** Objet réactif des filtres métier — à binder via v-model dans les <AppSelect>. */
  filters: F
  /** Terme de recherche — à binder via v-model dans le champ recherche. */
  search: Ref<string>
  /** Page courante (1-indexée). */
  page: Ref<number>
  /** Items par page. */
  perPage: Ref<number>
  /** Réinitialise à la page 1 puis recharge — à appeler quand un filtre change. */
  applyFilters: () => void | Promise<void>
  /** Change de page (depuis l'événement @page-change du DataTable) puis recharge. */
  handlePageChange: (page: number) => void | Promise<void>
  /** Recharge avec l'état courant (sans toucher à la page). */
  reload: () => void | Promise<void>
}

/**
 * Centralise la plomberie « pagination + recherche débounce + filtres » côté page,
 * pour le pattern server-side (cf. EmployeeListPage). Chaque page garde ses propres
 * filtres métier ; seule la mécanique répétée est factorisée.
 *
 * Exemple :
 * ```ts
 * const store = useCompanyStore()
 * const { filters, search, applyFilters, handlePageChange, reload } = useServerTable({
 *   initialFilters: { status: '' as '' | 'active' | 'inactive' },
 *   fetcher: (p) => store.fetchCompanies({
 *     page: p.page, perPage: p.perPage,
 *     search: p.search || undefined,
 *     status: p.status || undefined,
 *   }),
 * })
 * onMounted(reload)
 * ```
 */
export function useServerTable<F extends Record<string, unknown>>(
  opts: ServerTableOptions<F>,
): ServerTable<F> {
  const filters = reactive({ ...opts.initialFilters }) as F
  const search = ref('')
  const page = ref(1)
  const perPage = ref(opts.perPage ?? 15)

  function buildParams(): ServerTableParams<F> {
    return {
      ...(filters as F),
      page: page.value,
      perPage: perPage.value,
      search: search.value,
    }
  }

  function reload() {
    return opts.fetcher(buildParams())
  }

  function applyFilters() {
    page.value = 1
    return reload()
  }

  function handlePageChange(newPage: number) {
    page.value = newPage
    return reload()
  }

  const debouncedApply = useDebounceFn(applyFilters, opts.debounce ?? 400)

  // La frappe dans le champ recherche (v-model="search") relance avec débounce, page 1.
  watch(search, () => {
    debouncedApply()
  })

  return {
    filters,
    search,
    page,
    perPage,
    applyFilters,
    handlePageChange,
    reload,
  }
}
