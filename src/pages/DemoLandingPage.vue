<script setup lang="ts">
import { ref } from 'vue'
import {
  BuildingOffice2Icon,
  UserGroupIcon,
  UserIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/vue/24/outline'
import { enableDemo, type DemoRole } from '@/services/demo'

interface RoleCard {
  role: DemoRole
  title: string
  tagline: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any
  points: string[]
  accent: string
}

const roles: RoleCard[] = [
  {
    role: 'admin_enterprise',
    title: 'Admin entreprise',
    tagline: 'Vue complete de la solution',
    icon: BuildingOffice2Icon,
    points: ['Sites, departements et employes', 'Pointage RFID, QR et biometrie', 'Paie, rapports et abonnement'],
    accent: 'from-indigo-500 to-blue-600',
  },
  {
    role: 'manager',
    title: 'Manager',
    tagline: 'Pilotage des equipes au quotidien',
    icon: UserGroupIcon,
    points: ['Suivi de presence en temps reel', 'Validation des absences', 'Rapports et tableaux de bord'],
    accent: 'from-emerald-500 to-teal-600',
  },
  {
    role: 'employe',
    title: 'Employe',
    tagline: 'Espace personnel du collaborateur',
    icon: UserIcon,
    points: ['Mes pointages et mon historique', 'Mes demandes de conge', 'Mes fiches de paie'],
    accent: 'from-amber-500 to-orange-600',
  },
]

const launching = ref<DemoRole | null>(null)

function launch(role: DemoRole) {
  launching.value = role
  const home = enableDemo(role, true)
  // Rechargement complet : l'adaptateur démo s'installe dès le boot de l'app.
  window.location.assign(home)
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
    <div class="mx-auto max-w-6xl px-6 py-12 lg:py-16">
      <!-- En-tete -->
      <header class="text-center">
        <span class="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-emerald-300 ring-1 ring-white/15">
          <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Demonstration interactive
        </span>
        <h1 class="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
          Testez <span class="bg-gradient-to-r from-emerald-300 to-sky-300 bg-clip-text text-transparent">TangaFlow</span>
          sans inscription
        </h1>
        <p class="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
          Choisissez un profil et explorez l'application avec un jeu de donnees fictif.
          Ajoutez, modifiez, supprimez : tout fonctionne, rien n'est enregistre.
        </p>
      </header>

      <!-- Cartes de role -->
      <div class="mt-12 grid gap-6 md:grid-cols-3">
        <button
          v-for="card in roles"
          :key="card.role"
          type="button"
          class="group relative overflow-hidden rounded-2xl bg-white/5 p-6 text-left ring-1 ring-white/10 transition hover:-translate-y-1 hover:bg-white/10 hover:ring-white/25 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-60"
          :disabled="launching !== null"
          @click="launch(card.role)"
        >
          <div
            class="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg"
            :class="card.accent"
          >
            <component :is="card.icon" class="h-6 w-6" />
          </div>
          <h2 class="mt-5 text-xl font-semibold">{{ card.title }}</h2>
          <p class="mt-1 text-sm text-slate-400">{{ card.tagline }}</p>
          <ul class="mt-4 space-y-2">
            <li v-for="point in card.points" :key="point" class="flex items-start gap-2 text-sm text-slate-300">
              <CheckCircleIcon class="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
              <span>{{ point }}</span>
            </li>
          </ul>
          <span class="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-300 group-hover:gap-2.5 transition-all">
            <template v-if="launching === card.role">Lancement...</template>
            <template v-else>
              Lancer la demo
              <ArrowRightIcon class="h-4 w-4" />
            </template>
          </span>
        </button>
      </div>

      <!-- Note bas de page -->
      <p class="mt-12 text-center text-sm text-slate-400">
        Vous pourrez changer de profil ou reinitialiser les donnees a tout moment depuis la barre de demonstration.
      </p>
    </div>
  </div>
</template>
