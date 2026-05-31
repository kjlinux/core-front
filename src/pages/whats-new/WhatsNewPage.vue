<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSwipe } from '@vueuse/core'
import { useAuthStore } from '@/stores/auth.store'
import { useWhatsNew } from '@/composables/useWhatsNew'
import { UserRole } from '@/types/enums'
import {
  resolveItemForRole,
  itemAudience,
  WHATS_NEW_PERIOD,
  type AccentKey,
  type WhatsNewCategory,
  type WhatsNewItem,
} from '@/config/whats-new'
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  ArrowUpRightIcon,
  SparklesIcon,
  HandRaisedIcon,
  RocketLaunchIcon,
  HeartIcon,
  UserGroupIcon,
} from '@heroicons/vue/24/outline'

const router = useRouter()
const auth = useAuthStore()
const { items, version, markSeen } = useWhatsNew()

const role = computed(() => auth.user?.role ?? null)
const isSuperAdmin = computed(() => role.value === UserRole.SUPER_ADMIN)
const firstName = computed(() => auth.user?.firstName?.trim() || 'à vous')

// Texte d'intro adapte : le super_admin a une vue d'ensemble (toutes les nouveautes,
// tous profils confondus), les autres voient une selection personnalisee.
const introSubtitle = computed(() =>
  isSuperAdmin.value
    ? `En tant que super administrateur, vous avez la vue d'ensemble : voici tout ce qui a changé ce mois-ci (${WHATS_NEW_PERIOD}), avec le profil concerné par chaque nouveauté. Prenons une minute pour tout passer en revue.`
    : `On a pas mal travaillé ces derniers jours (${WHATS_NEW_PERIOD}), et tout n'a pas été fait au hasard : voici les nouveautés choisies rien que pour vous. Prenons trente secondes pour les découvrir ensemble.`,
)

// --- Construction du deck de slides ------------------------------------------
const features = computed(() => items.value.filter((i) => i.category === 'feature'))
const improvements = computed(() => items.value.filter((i) => i.category === 'improvement'))
const fixes = computed(() => items.value.filter((i) => i.category === 'fix'))

type Slide =
  | { type: 'intro' }
  | { type: 'feature'; item: WhatsNewItem }
  | { type: 'group'; category: Exclude<WhatsNewCategory, 'feature'>; items: WhatsNewItem[] }
  | { type: 'outro' }

const slides = computed<Slide[]>(() => {
  const list: Slide[] = [{ type: 'intro' }]
  for (const item of features.value) list.push({ type: 'feature', item })
  if (improvements.value.length)
    list.push({ type: 'group', category: 'improvement', items: improvements.value })
  if (fixes.value.length) list.push({ type: 'group', category: 'fix', items: fixes.value })
  list.push({ type: 'outro' })
  return list
})

// --- Navigation ---------------------------------------------------------------
const currentIndex = ref(0)
const direction = ref<'next' | 'prev'>('next')

const currentSlide = computed<Slide>(() => slides.value[currentIndex.value] ?? { type: 'intro' })
const isLast = computed(() => currentIndex.value >= slides.value.length - 1)
const transitionName = computed(() => (direction.value === 'next' ? 'slide-next' : 'slide-prev'))

// Helpers types-surs pour le template : vue-tsc ne propage pas le narrowing d'un
// computed "union" a travers plusieurs acces successifs, on expose donc des refs deja
// discriminees.
const isIntro = computed(() => currentSlide.value.type === 'intro')
const featureItem = computed<WhatsNewItem | null>(() =>
  currentSlide.value.type === 'feature' ? currentSlide.value.item : null,
)
const groupSlide = computed(() =>
  currentSlide.value.type === 'group' ? currentSlide.value : null,
)

function next() {
  if (currentIndex.value < slides.value.length - 1) {
    direction.value = 'next'
    currentIndex.value++
  } else {
    leave()
  }
}
function prev() {
  if (currentIndex.value > 0) {
    direction.value = 'prev'
    currentIndex.value--
  }
}
function goTo(index: number) {
  if (index === currentIndex.value) return
  direction.value = index > currentIndex.value ? 'next' : 'prev'
  currentIndex.value = index
}

/** Accueil naturel de chaque role : on y renvoie l'utilisateur apres la visite, sans
 *  passer par '/' (dont l'acces est restreint pour employe / support_it). */
function homePath(): string {
  const r = auth.user?.role
  if (r === 'employe') return '/mon-espace'
  if (r === 'support_it') return '/support-it/health'
  return '/'
}

/** Fin de visite ou passage : on memorise puis on renvoie a la page habituelle. */
function leave() {
  markSeen()
  router.replace(homePath())
}

// --- Raccourcis clavier -------------------------------------------------------
function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
    e.preventDefault()
    next()
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    prev()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    leave()
  }
}

// --- Swipe tactile ------------------------------------------------------------
const stage = ref<HTMLElement | null>(null)
useSwipe(stage, {
  onSwipeEnd(_e, dir) {
    if (dir === 'left') next()
    else if (dir === 'right') prev()
  },
})

onMounted(() => {
  // Visiter la page suffit a la marquer comme vue : a la prochaine connexion, plus
  // d'ouverture auto, seulement le bandeau "revoir" (cf. useWhatsNew).
  markSeen()
  if (items.value.length === 0) {
    router.replace('/')
    return
  }
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

// --- Style : degrades d'accent et chips de categorie --------------------------
const ACCENT_TILE: Record<AccentKey, string> = {
  indigo: 'from-indigo-500 to-violet-600 shadow-indigo-500/40',
  violet: 'from-violet-500 to-fuchsia-600 shadow-violet-500/40',
  emerald: 'from-emerald-500 to-teal-600 shadow-emerald-500/40',
  sky: 'from-sky-500 to-blue-600 shadow-sky-500/40',
  amber: 'from-amber-500 to-orange-600 shadow-amber-500/40',
  rose: 'from-rose-500 to-pink-600 shadow-rose-500/40',
  cyan: 'from-cyan-500 to-sky-600 shadow-cyan-500/40',
}

const CATEGORY_META: Record<WhatsNewCategory, { label: string; chip: string }> = {
  feature: { label: 'Nouveauté', chip: 'bg-indigo-400/15 text-indigo-200 ring-1 ring-indigo-300/30' },
  improvement: {
    label: 'Amélioration',
    chip: 'bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-300/30',
  },
  fix: { label: 'Correction', chip: 'bg-amber-400/15 text-amber-100 ring-1 ring-amber-300/30' },
}

const GROUP_META: Record<
  Exclude<WhatsNewCategory, 'feature'>,
  { title: string; subtitle: string }
> = {
  improvement: {
    title: 'On a peaufiné les détails',
    subtitle: 'Des améliorations pensées pour vous simplifier la vie au quotidien.',
  },
  fix: {
    title: 'On a chassé les petits soucis',
    subtitle: 'Quelques corrections pour une expérience encore plus sereine.',
  },
}

function resolved(item: WhatsNewItem) {
  return resolveItemForRole(item, role.value)
}

/** Public cible d'une nouveaute (affiche uniquement cote super_admin). */
function audienceOf(item: WhatsNewItem) {
  return itemAudience(item)
}

// Confettis CSS deterministes (pas de lib) affiches sur la slide finale.
const confetti = Array.from({ length: 42 }, (_, i) => {
  const palette = ['#818cf8', '#34d399', '#fbbf24', '#f472b6', '#22d3ee', '#fb7185', '#a78bfa']
  return {
    left: (i * 23) % 100,
    delay: (i % 14) * 0.18,
    duration: 2.6 + ((i * 7) % 5) * 0.35,
    size: 7 + (i % 4) * 3,
    rotate: (i * 47) % 360,
    color: palette[i % palette.length],
    round: i % 3 === 0,
  }
})
</script>

<template>
  <div
    class="relative flex min-h-screen w-full flex-col overflow-hidden bg-linear-to-br from-slate-950 via-indigo-950 to-slate-900 text-white"
  >
    <!-- Halos decoratifs -->
    <div
      class="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl blob-a"
    />
    <div
      class="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-fuchsia-600/20 blur-3xl blob-b"
    />
    <div
      class="pointer-events-none absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-500/15 blur-3xl blob-c"
    />

    <!-- En-tete : marque + version + passer la visite -->
    <header class="relative z-10 flex items-center justify-between px-5 py-4 sm:px-8">
      <div class="flex items-center gap-3">
        <span class="text-base font-bold tracking-wide sm:text-lg">TANGAFLOW</span>
        <span
          class="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-200 ring-1 ring-white/15"
        >
          v{{ version }}
        </span>
      </div>
      <button
        type="button"
        class="group inline-flex items-center gap-1.5 rounded-full bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
        @click="leave"
      >
        Passer la visite
        <ArrowUpRightIcon class="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </button>
    </header>

    <!-- Barre de progression segmentee -->
    <div class="relative z-10 flex gap-1.5 px-5 sm:px-8" role="progressbar">
      <button
        v-for="(s, i) in slides"
        :key="i"
        type="button"
        class="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10 transition"
        :aria-label="`Aller à l'étape ${i + 1}`"
        @click="goTo(i)"
      >
        <span
          class="block h-full rounded-full bg-linear-to-r from-indigo-400 to-fuchsia-400 transition-all duration-500"
          :style="{ width: i < currentIndex ? '100%' : i === currentIndex ? '100%' : '0%', opacity: i <= currentIndex ? 1 : 0 }"
        />
      </button>
    </div>

    <!-- Scene -->
    <main
      ref="stage"
      class="relative z-10 flex flex-1 items-center justify-center px-5 py-6 sm:px-8"
    >
      <Transition :name="transitionName" mode="out-in">
        <div :key="currentIndex" class="w-full max-w-3xl">
          <!-- INTRO -->
          <section v-if="isIntro" class="text-center">
            <div
              class="anim-pop mx-auto flex h-28 w-28 items-center justify-center rounded-[1.75rem] bg-linear-to-br from-indigo-500 to-fuchsia-600 shadow-2xl shadow-indigo-500/40 float sm:h-32 sm:w-32"
            >
              <HandRaisedIcon class="h-14 w-14 text-white sm:h-16 sm:w-16" />
            </div>
            <p class="anim-rise mt-8 text-lg font-medium text-indigo-200" style="animation-delay: 0.1s">
              Bonjour {{ firstName }},
            </p>
            <h1
              class="anim-rise mt-2 text-4xl font-extrabold leading-tight sm:text-5xl"
              style="animation-delay: 0.18s"
            >
              TangaFlow passe en
              <span class="bg-linear-to-r from-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">
                version {{ version }}
              </span>
            </h1>
            <p
              class="anim-rise mx-auto mt-5 max-w-xl text-base text-slate-300 sm:text-lg"
              style="animation-delay: 0.26s"
            >
              {{ introSubtitle }}
            </p>
            <div class="anim-rise mt-9 flex items-center justify-center gap-3" style="animation-delay: 0.34s">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-indigo-500 to-fuchsia-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/40 transition hover:scale-[1.03] hover:from-indigo-400 hover:to-fuchsia-500 active:scale-95"
                @click="next"
              >
                C'est parti
                <ArrowRightIcon class="h-5 w-5" />
              </button>
            </div>
          </section>

          <!-- SLIDE FONCTIONNALITE -->
          <section v-else-if="featureItem" class="text-center">
            <div
              class="anim-pop mx-auto flex h-28 w-28 items-center justify-center rounded-[1.75rem] bg-linear-to-br shadow-2xl float sm:h-32 sm:w-32"
              :class="ACCENT_TILE[featureItem.accent]"
            >
              <component :is="featureItem.icon" class="h-14 w-14 text-white sm:h-16 sm:w-16" />
            </div>

            <div class="anim-rise mt-7 flex items-center justify-center gap-2" style="animation-delay: 0.08s">
              <span
                class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                :class="CATEGORY_META[featureItem.category].chip"
              >
                <SparklesIcon class="h-3.5 w-3.5" />
                {{ resolved(featureItem).tag || CATEGORY_META[featureItem.category].label }}
              </span>
            </div>

            <h2
              class="anim-rise mt-4 text-3xl font-extrabold leading-tight sm:text-4xl"
              style="animation-delay: 0.16s"
            >
              {{ resolved(featureItem).title }}
            </h2>
            <p
              class="anim-rise mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg"
              style="animation-delay: 0.24s"
            >
              {{ resolved(featureItem).description }}
            </p>

            <!-- Public cible : visible uniquement par le super_admin -->
            <div
              v-if="isSuperAdmin"
              class="anim-rise mt-6 flex flex-wrap items-center justify-center gap-1.5"
              style="animation-delay: 0.32s"
            >
              <span class="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                <UserGroupIcon class="h-4 w-4" />
                Pour
              </span>
              <span v-if="audienceOf(featureItem).allProfiles" class="audience-chip">
                Tous les profils
              </span>
              <template v-else>
                <span v-for="label in audienceOf(featureItem).labels" :key="label" class="audience-chip">
                  {{ label }}
                </span>
              </template>
            </div>
          </section>

          <!-- SLIDE GROUPE (ameliorations / corrections) -->
          <section v-else-if="groupSlide">
            <div class="text-center">
              <span
                class="anim-rise inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                :class="CATEGORY_META[groupSlide.category].chip"
              >
                {{ CATEGORY_META[groupSlide.category].label }}
              </span>
              <h2 class="anim-rise mt-3 text-3xl font-extrabold sm:text-4xl" style="animation-delay: 0.08s">
                {{ GROUP_META[groupSlide.category].title }}
              </h2>
              <p class="anim-rise mx-auto mt-3 max-w-xl text-slate-300" style="animation-delay: 0.14s">
                {{ GROUP_META[groupSlide.category].subtitle }}
              </p>
            </div>

            <div class="mt-8 grid gap-3 sm:grid-cols-2">
              <div
                v-for="(item, idx) in groupSlide.items"
                :key="item.id"
                class="anim-rise flex items-start gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur-sm"
                :style="{ animationDelay: 0.18 + idx * 0.07 + 's' }"
              >
                <div
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linear-to-br"
                  :class="ACCENT_TILE[item.accent]"
                >
                  <component :is="item.icon" class="h-6 w-6 text-white" />
                </div>
                <div class="min-w-0">
                  <p class="font-semibold leading-snug">{{ resolved(item).title }}</p>
                  <p class="mt-1 text-sm leading-relaxed text-slate-300">
                    {{ resolved(item).description }}
                  </p>
                  <!-- Public cible : visible uniquement par le super_admin -->
                  <div v-if="isSuperAdmin" class="mt-2 flex flex-wrap gap-1">
                    <span v-if="audienceOf(item).allProfiles" class="audience-chip">
                      Tous les profils
                    </span>
                    <template v-else>
                      <span v-for="label in audienceOf(item).labels" :key="label" class="audience-chip">
                        {{ label }}
                      </span>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- OUTRO -->
          <section v-else class="relative text-center">
            <!-- Confettis -->
            <div class="pointer-events-none absolute inset-x-0 -top-24 bottom-0 overflow-hidden">
              <span
                v-for="(c, i) in confetti"
                :key="i"
                class="confetti-piece absolute top-0 block"
                :style="{
                  left: c.left + '%',
                  width: c.size + 'px',
                  height: c.size + 'px',
                  backgroundColor: c.color,
                  borderRadius: c.round ? '9999px' : '2px',
                  animationDelay: c.delay + 's',
                  animationDuration: c.duration + 's',
                  ['--rot' as string]: c.rotate + 'deg',
                }"
              />
            </div>

            <div
              class="anim-pop relative mx-auto flex h-28 w-28 items-center justify-center rounded-[1.75rem] bg-linear-to-br from-emerald-500 to-teal-600 shadow-2xl shadow-emerald-500/40 float sm:h-32 sm:w-32"
            >
              <RocketLaunchIcon class="h-14 w-14 text-white sm:h-16 sm:w-16" />
            </div>
            <h2 class="anim-rise mt-8 text-4xl font-extrabold sm:text-5xl" style="animation-delay: 0.1s">
              Et voilà, {{ firstName }} !
            </h2>
            <p class="anim-rise mx-auto mt-4 max-w-xl text-base text-slate-300 sm:text-lg" style="animation-delay: 0.18s">
              <template v-if="isSuperAdmin">
                Vous avez fait le tour complet de la version {{ version }}, profil par profil. Vos
                équipes vont adorer.
              </template>
              <template v-else>
                Vous êtes à jour. On espère que ces nouveautés vous rendront le quotidien plus simple
                et un peu plus agréable.
              </template>
            </p>

            <div class="anim-rise mt-7 flex flex-wrap items-center justify-center gap-2.5" style="animation-delay: 0.26s">
              <span
                v-if="features.length"
                class="rounded-full bg-indigo-400/15 px-3.5 py-1.5 text-sm font-semibold text-indigo-200 ring-1 ring-indigo-300/30"
              >
                {{ features.length }} nouveauté{{ features.length > 1 ? 's' : '' }}
              </span>
              <span
                v-if="improvements.length"
                class="rounded-full bg-emerald-400/15 px-3.5 py-1.5 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-300/30"
              >
                {{ improvements.length }} amélioration{{ improvements.length > 1 ? 's' : '' }}
              </span>
              <span
                v-if="fixes.length"
                class="rounded-full bg-amber-400/15 px-3.5 py-1.5 text-sm font-semibold text-amber-100 ring-1 ring-amber-300/30"
              >
                {{ fixes.length }} correction{{ fixes.length > 1 ? 's' : '' }}
              </span>
            </div>

            <div class="anim-rise mt-9" style="animation-delay: 0.34s">
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-full bg-linear-to-r from-indigo-500 to-fuchsia-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/40 transition hover:scale-[1.03] hover:from-indigo-400 hover:to-fuchsia-500 active:scale-95"
                @click="leave"
              >
                Commencer à explorer
                <ArrowRightIcon class="h-5 w-5" />
              </button>
            </div>
            <p class="anim-rise mt-6 inline-flex items-center gap-1.5 text-sm text-slate-400" style="animation-delay: 0.42s">
              Fait avec <HeartIcon class="h-4 w-4 text-rose-400" /> par l'équipe TangaFlow
            </p>
          </section>
        </div>
      </Transition>
    </main>

    <!-- Pied : navigation -->
    <footer class="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
      <button
        type="button"
        class="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-0"
        :disabled="currentIndex === 0"
        @click="prev"
      >
        <ArrowLeftIcon class="h-4 w-4" />
        Précédent
      </button>

      <span class="text-xs font-medium tabular-nums text-slate-400">
        {{ currentIndex + 1 }} / {{ slides.length }}
      </span>

      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/15 transition hover:bg-white/20"
        @click="next"
      >
        {{ isLast ? 'Terminer' : 'Suivant' }}
        <ArrowRightIcon class="h-4 w-4" />
      </button>
    </footer>
  </div>
</template>

<style scoped>
/* Pastille "public cible" (super_admin) */
.audience-chip {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  background-color: rgb(255 255 255 / 0.08);
  padding: 0.125rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(226 232 240);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.12);
}

/* Transition entre slides (sens dependant de la navigation) */
.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition:
    opacity 0.4s ease,
    transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}
.slide-next-enter-from {
  opacity: 0;
  transform: translateX(48px);
}
.slide-next-leave-to {
  opacity: 0;
  transform: translateX(-48px);
}
.slide-prev-enter-from {
  opacity: 0;
  transform: translateX(-48px);
}
.slide-prev-leave-to {
  opacity: 0;
  transform: translateX(48px);
}

/* Entree des elements d'une slide */
.anim-pop {
  animation: pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.anim-rise {
  animation: rise 0.55s ease both;
}
@keyframes pop {
  from {
    opacity: 0;
    transform: scale(0.6) translateY(12px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Flottement doux de l'icone principale */
.float {
  animation: float 5s ease-in-out infinite;
}
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Halos qui respirent */
.blob-a {
  animation: drift 16s ease-in-out infinite;
}
.blob-b {
  animation: drift 20s ease-in-out infinite reverse;
}
.blob-c {
  animation: drift 24s ease-in-out infinite;
}
@keyframes drift {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(24px, -24px) scale(1.08);
  }
}

/* Confettis de la slide finale */
.confetti-piece {
  top: -24px;
  animation-name: confetti-fall;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  opacity: 0.9;
}
@keyframes confetti-fall {
  0% {
    transform: translateY(-10%) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  100% {
    transform: translateY(105vh) rotate(var(--rot, 360deg));
    opacity: 0.9;
  }
}

@media (prefers-reduced-motion: reduce) {
  .anim-pop,
  .anim-rise,
  .float,
  .blob-a,
  .blob-b,
  .blob-c,
  .confetti-piece {
    animation: none;
  }
}
</style>
