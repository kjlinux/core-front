<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { employeeApi } from '@/services/api/employee.api'
import {
  MagnifyingGlassIcon,
  ArrowRightIcon,
  UserIcon,
  DocumentIcon,
} from '@heroicons/vue/24/outline'

interface PageItem {
  kind: 'page'
  label: string
  path: string
  group: string
}
interface EmployeeItem {
  kind: 'employee'
  label: string
  subtitle: string
  path: string
}
type Item = PageItem | EmployeeItem

const router = useRouter()
const auth = useAuthStore()

const isOpen = ref(false)
const query = ref('')
const selectedIndex = ref(0)
const inputEl = ref<HTMLInputElement | null>(null)
const employeeResults = ref<EmployeeItem[]>([])
const searchAbort = ref<AbortController | null>(null)
let searchTimer: ReturnType<typeof setTimeout> | null = null

// Index des pages depuis le router
const allPages = computed<PageItem[]>(() => {
  const items: PageItem[] = []
  const userRole = auth.user?.role
  for (const r of router.getRoutes()) {
    const title = r.meta?.title as string | undefined
    if (!title || !r.path || r.path.includes(':') || r.path.startsWith('/auth')) continue
    if (r.meta?.layout === 'none' || r.meta?.layout === 'auth') continue
    const roles = r.meta?.roles as string[] | undefined
    if (roles && userRole && !roles.includes(userRole)) continue
    const segment = r.path.split('/')[1] || 'general'
    items.push({ kind: 'page', label: title, path: r.path, group: segment })
  }
  // dedupe par path
  const seen = new Set<string>()
  return items.filter((p) => {
    if (seen.has(p.path)) return false
    seen.add(p.path)
    return true
  })
})

const filteredPages = computed<PageItem[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return allPages.value.slice(0, 8)
  return allPages.value
    .filter((p) => p.label.toLowerCase().includes(q) || p.path.toLowerCase().includes(q))
    .slice(0, 8)
})

const results = computed<Item[]>(() => [...filteredPages.value, ...employeeResults.value])

async function searchEmployees(q: string) {
  if (q.length < 2) {
    employeeResults.value = []
    return
  }
  searchAbort.value?.abort()
  const controller = new AbortController()
  searchAbort.value = controller
  try {
    const res = await employeeApi.getAll({ search: q, perPage: 5 })
    if (controller.signal.aborted) return
    employeeResults.value = (res.data ?? []).map((e: any) => ({
      kind: 'employee' as const,
      label: `${e.firstName} ${e.lastName}`,
      subtitle: e.employeeNumber ? `#${e.employeeNumber}` : (e.email ?? ''),
      path: `/pointage-rfid/employees/${e.id}`,
    }))
  } catch {
    employeeResults.value = []
  }
}

watch(query, (q) => {
  selectedIndex.value = 0
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => searchEmployees(q.trim()), 250)
})

function open() {
  isOpen.value = true
  query.value = ''
  selectedIndex.value = 0
  employeeResults.value = []
  nextTick(() => inputEl.value?.focus())
}

function close() {
  isOpen.value = false
}

function selectItem(item: Item) {
  router.push(item.path)
  close()
}

function moveSelection(delta: number) {
  const len = results.value.length
  if (!len) return
  selectedIndex.value = (selectedIndex.value + delta + len) % len
}

function onKeydown(e: KeyboardEvent) {
  const isMeta = e.metaKey || e.ctrlKey
  if (isMeta && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    isOpen.value ? close() : open()
    return
  }
  if (!isOpen.value) return
  if (e.key === 'Escape') { e.preventDefault(); close() }
  else if (e.key === 'ArrowDown') { e.preventDefault(); moveSelection(1) }
  else if (e.key === 'ArrowUp') { e.preventDefault(); moveSelection(-1) }
  else if (e.key === 'Enter') {
    const item = results.value[selectedIndex.value]
    if (item) { e.preventDefault(); selectItem(item) }
  }
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="palette">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-24"
        role="dialog"
        aria-modal="true"
        aria-label="Recherche rapide"
      >
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="close" />

        <div class="relative w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-800">
          <div class="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <MagnifyingGlassIcon class="h-5 w-5 text-gray-400" />
            <input
              ref="inputEl"
              v-model="query"
              type="text"
              class="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none dark:text-gray-100"
              placeholder="Rechercher pages, employes..."
              aria-label="Recherche"
            />
            <kbd class="rounded border border-gray-300 px-1.5 py-0.5 text-xs text-gray-500 dark:border-gray-600 dark:text-gray-400">
              Esc
            </kbd>
          </div>

          <ul v-if="results.length > 0" class="max-h-80 overflow-y-auto py-2">
            <li
              v-for="(item, idx) in results"
              :key="`${item.kind}-${item.path}-${idx}`"
              :class="[
                'flex cursor-pointer items-center gap-3 px-4 py-2 text-sm',
                idx === selectedIndex
                  ? 'bg-primary-100 text-primary-900 dark:bg-primary-700 dark:text-white'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700',
              ]"
              @click="selectItem(item)"
              @mouseenter="selectedIndex = idx"
            >
              <DocumentIcon v-if="item.kind === 'page'" class="h-4 w-4 flex-shrink-0 text-gray-400" />
              <UserIcon v-else class="h-4 w-4 flex-shrink-0 text-gray-400" />
              <div class="min-w-0 flex-1">
                <p class="truncate font-medium">{{ item.label }}</p>
                <p v-if="item.kind === 'employee'" class="truncate text-xs text-gray-500 dark:text-gray-400">
                  {{ item.subtitle }}
                </p>
                <p v-else class="truncate text-xs text-gray-500 dark:text-gray-400">{{ item.path }}</p>
              </div>
              <ArrowRightIcon v-if="idx === selectedIndex" class="h-4 w-4 flex-shrink-0" />
            </li>
          </ul>

          <div v-else class="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Aucun resultat
          </div>

          <div class="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
            <span>
              <kbd class="rounded border border-gray-300 px-1.5 py-0.5 dark:border-gray-600">Enter</kbd>
              pour ouvrir
            </span>
            <span>
              <kbd class="rounded border border-gray-300 px-1.5 py-0.5 dark:border-gray-600">Ctrl</kbd>
              +
              <kbd class="rounded border border-gray-300 px-1.5 py-0.5 dark:border-gray-600">K</kbd>
              pour rouvrir
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.palette-enter-active,
.palette-leave-active {
  transition: opacity 0.2s ease;
}
.palette-enter-from,
.palette-leave-to {
  opacity: 0;
}
</style>
