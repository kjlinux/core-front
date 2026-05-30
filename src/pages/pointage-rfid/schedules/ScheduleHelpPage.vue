<template>
  <div class="schedule-help-page mx-auto max-w-3xl">
    <div class="mb-6">
      <AppButton variant="outline" size="sm" @click="goBack">
        <ArrowLeftIcon class="mr-2 inline h-4 w-4" />
        {{ t('common.back') }}
      </AppButton>
    </div>

    <!-- En-tête -->
    <AppCard class="mb-6">
      <div class="flex items-start gap-3">
        <div class="rounded-full bg-primary-50 p-2">
          <QuestionMarkCircleIcon class="h-7 w-7 text-primary-700" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Comment configurer un horaire</h1>
          <p class="mt-1 text-sm text-gray-500">
            Un guide simple, avec des exemples, pour remplir le formulaire sans se tromper.
          </p>
        </div>
      </div>
    </AppCard>

    <!-- C'est quoi un horaire -->
    <AppCard class="mb-6">
      <h2 class="mb-2 flex items-center gap-2 text-lg font-semibold text-gray-900">
        <ClockIcon class="h-5 w-5 text-primary-700" /> C'est quoi un « horaire » ?
      </h2>
      <p class="text-sm leading-relaxed text-gray-700">
        Un horaire, c'est un <strong>modèle de journée de travail</strong> que vous préparez une
        fois, puis que vous attribuez à des employés. Grâce à lui, le système sait
        <strong>à quelles heures chaque personne est censée être présente</strong> et peut
        repérer tout seul les retards et les absences à partir des badges au lecteur.
      </p>
      <p class="mt-2 text-sm leading-relaxed text-gray-700">
        Vous créez par exemple un horaire « Bureau 8h–17h » et tous les employés concernés
        l'utilisent. Si les heures changent un jour, vous modifiez l'horaire une seule fois.
      </p>
    </AppCard>

    <!-- Les 3 étapes -->
    <AppCard class="mb-6">
      <h2 class="mb-3 text-lg font-semibold text-gray-900">Le formulaire en 3 parties</h2>
      <ol class="space-y-3">
        <li class="flex gap-3">
          <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-800 text-xs font-bold text-white">1</span>
          <span class="text-sm text-gray-700">
            <strong>L'horaire de travail</strong> - les informations générales : l'entreprise, le
            nom de l'horaire, et la tolérance de retard.
          </span>
        </li>
        <li class="flex gap-3">
          <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-800 text-xs font-bold text-white">2</span>
          <span class="text-sm text-gray-700">
            <strong>Les jours et les segments</strong> - vous cochez les jours travaillés et vous
            indiquez les heures. C'est le cœur du formulaire.
          </span>
        </li>
        <li class="flex gap-3">
          <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-800 text-xs font-bold text-white">3</span>
          <span class="text-sm text-gray-700">
            <strong>Les départements concernés</strong> - qui utilisera cet horaire par défaut.
          </span>
        </li>
      </ol>
    </AppCard>

    <!-- Étape 1 -->
    <AppCard class="mb-6">
      <h2 class="mb-3 text-lg font-semibold text-gray-900">1. L'horaire de travail</h2>
      <dl class="space-y-3 text-sm">
        <div>
          <dt class="font-medium text-gray-900">Entreprise</dt>
          <dd class="text-gray-700">L'entreprise à laquelle appartient cet horaire.</dd>
        </div>
        <div>
          <dt class="font-medium text-gray-900">Nom</dt>
          <dd class="text-gray-700">
            Un nom parlant pour le reconnaître plus tard. Par exemple : « Horaire Jour »,
            « Équipe de nuit », « Mi-temps matin ».
          </dd>
        </div>
        <div>
          <dt class="font-medium text-gray-900">Type (automatique)</dt>
          <dd class="text-gray-700">
            Vous ne le choisissez pas : le système affiche <strong>« Jour »</strong> ou
            <strong>« Nuit »</strong> tout seul, en fonction des heures que vous saisissez plus bas.
            Dès qu'un créneau passe après minuit, il devient « Nuit ».
          </dd>
        </div>
        <div>
          <dt class="font-medium text-gray-900">Tolérance retard par défaut (minutes)</dt>
          <dd class="text-gray-700">
            Le petit délai accordé avant de compter quelqu'un en retard. Avec une tolérance de
            <strong>10 minutes</strong> et une arrivée prévue à 8h00, un badge à 8h08 reste
            « à l'heure », mais un badge à 8h15 est « en retard ».
          </dd>
        </div>
      </dl>
    </AppCard>

    <!-- Étape 2 -->
    <AppCard class="mb-6">
      <h2 class="mb-3 text-lg font-semibold text-gray-900">2. Les jours et les segments</h2>

      <p class="mb-3 text-sm leading-relaxed text-gray-700">
        Cochez chaque jour où l'on travaille. Pour chaque jour coché, vous ajoutez un ou plusieurs
        <strong>segments</strong>.
      </p>

      <div class="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
        <p class="font-medium">Un « segment », c'est quoi ?</p>
        <p class="mt-1">
          C'est une <strong>tranche de travail</strong> dans la journée. Une journée normale n'a
          qu'<strong>un seul segment</strong> (ex. 8h00 → 17h00). Si la journée est coupée par une
          longue pause déjeuner, on met <strong>deux segments</strong> : un le matin, un l'après-midi.
        </p>
      </div>

      <h3 class="mb-2 mt-4 font-medium text-gray-900">Pour chaque segment, vous renseignez :</h3>
      <dl class="space-y-3 text-sm">
        <div>
          <dt class="font-medium text-gray-900">Début et Fin</dt>
          <dd class="text-gray-700">
            L'heure à laquelle la tranche commence et celle où elle se termine
            (ex. <strong>08:00</strong> → <strong>17:00</strong>). C'est la « fenêtre » de travail.
          </dd>
        </div>
        <div>
          <dt class="font-medium text-gray-900">Type (automatique)</dt>
          <dd class="text-gray-700">
            Matin / Soir / Journée / Nuit : déduit tout seul à partir des heures. Rien à saisir.
          </dd>
        </div>
        <div>
          <dt class="font-medium text-gray-900">Tolérance (min)</dt>
          <dd class="text-gray-700">
            La tolérance de retard pour ce segment précis (reprend la valeur par défaut, modifiable).
          </dd>
        </div>
        <div>
          <dt class="font-medium text-gray-900">Pointages attendus - le point important</dt>
          <dd class="text-gray-700">
            Ce sont les <strong>heures précises où l'employé doit badger</strong>. C'est
            <strong>uniquement là-dessus</strong> que le système juge si la personne est présente,
            en retard ou absente.
          </dd>
        </div>
      </dl>

      <div class="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <p class="flex items-center gap-2 font-medium">
          <ExclamationTriangleIcon class="h-5 w-5" /> Différence entre « Début/Fin » et « Pointages attendus »
        </p>
        <ul class="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong>Début / Fin</strong> = la fenêtre générale de la tranche (et sert à deviner le type
            Jour/Nuit). Ce n'est <em>pas</em> ce qui calcule le retard.
          </li>
          <li>
            <strong>Pointages attendus</strong> = les moments exacts à badger. C'est ce qui sert à
            mesurer le retard et la présence.
          </li>
        </ul>
        <p class="mt-2">
          Bonne nouvelle : quand vous saisissez l'heure de Début, l'application crée
          automatiquement un pointage <strong>« Arrivée »</strong> à cette heure ; idem un pointage
          <strong>« Départ »</strong> quand vous saisissez la Fin. Vous pouvez ensuite les ajuster,
          en ajouter (bouton <strong>+ Heure</strong>) ou en supprimer.
        </p>
      </div>

      <div class="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
        <p class="font-medium text-gray-900">Le bouton « Copier vers… »</p>
        <p class="mt-1">
          Pratique quand plusieurs jours sont identiques : configurez le lundi, puis « Copier vers… »
          mardi, mercredi… au lieu de tout retaper. Attention, cela <strong>remplace</strong> les
          segments des jours choisis.
        </p>
      </div>
    </AppCard>

    <!-- Étape 3 -->
    <AppCard class="mb-6">
      <h2 class="mb-2 flex items-center gap-2 text-lg font-semibold text-gray-900">
        <BuildingOffice2Icon class="h-5 w-5 text-primary-700" /> 3. Les départements concernés
      </h2>
      <p class="text-sm leading-relaxed text-gray-700">
        Cochez les départements dont les employés utiliseront cet horaire <strong>par défaut</strong>.
        Vous pouvez toujours attribuer un horaire différent à une personne en particulier : son
        horaire individuel a la priorité.
      </p>
    </AppCard>

    <!-- Exemples concrets -->
    <AppCard class="mb-6">
      <h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
        <LightBulbIcon class="h-5 w-5 text-primary-700" /> Exemples concrets
      </h2>

      <div class="space-y-4">
        <div class="rounded-lg border border-gray-200 p-4">
          <h3 class="font-semibold text-gray-900">Exemple 1 - Bureau classique</h3>
          <p class="mt-1 text-sm text-gray-700">Du lundi au vendredi, 8h00 à 17h00.</p>
          <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
            <li>Cochez <strong>Lundi → Vendredi</strong>.</li>
            <li>Sur le lundi, un seul segment : Début <strong>08:00</strong>, Fin <strong>17:00</strong>.</li>
            <li>
              Pointages attendus : <strong>08:00</strong> (Arrivée) et <strong>17:00</strong> (Départ)
              - déjà pré-remplis.
            </li>
            <li>Utilisez <strong>« Copier vers… »</strong> pour appliquer au reste de la semaine.</li>
          </ul>
        </div>

        <div class="rounded-lg border border-gray-200 p-4">
          <h3 class="font-semibold text-gray-900">Exemple 2 - Journée coupée (pause déjeuner)</h3>
          <p class="mt-1 text-sm text-gray-700">
            Travail le matin et l'après-midi, avec une vraie coupure le midi.
          </p>
          <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
            <li><strong>Segment 1</strong> : Début 08:00, Fin 12:00 - pointages 08:00 et 12:00.</li>
            <li>
              Cliquez sur <strong>+ Segment</strong> et ajoutez le <strong>Segment 2</strong> :
              Début 14:00, Fin 18:00 - pointages 14:00 et 18:00.
            </li>
            <li>La personne badge donc <strong>4 fois</strong> dans la journée.</li>
          </ul>
        </div>

        <div class="rounded-lg border border-gray-200 p-4">
          <h3 class="font-semibold text-gray-900">Exemple 3 - Équipe de nuit</h3>
          <p class="mt-1 text-sm text-gray-700">De 22h00 à 6h00 le lendemain.</p>
          <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
            <li>Un segment : Début <strong>22:00</strong>, Fin <strong>06:00</strong>.</li>
            <li>
              Comme le créneau passe minuit, le Type bascule automatiquement sur
              <strong>« Nuit »</strong>. Vous n'avez rien à faire.
            </li>
            <li>Pointages attendus : 22:00 (Arrivée) et 06:00 (Départ).</li>
          </ul>
        </div>

        <div class="rounded-lg border border-gray-200 p-4">
          <h3 class="font-semibold text-gray-900">Exemple 4 - Mi-temps du matin</h3>
          <p class="mt-1 text-sm text-gray-700">Seulement les matinées, du lundi au vendredi.</p>
          <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
            <li>Un segment : Début 08:00, Fin 12:00.</li>
            <li>Si vous ne voulez contrôler que l'arrivée, gardez le pointage 08:00 et supprimez celui de 12:00.</li>
          </ul>
        </div>
      </div>
    </AppCard>

    <!-- FAQ -->
    <AppCard class="mb-6">
      <h2 class="mb-4 text-lg font-semibold text-gray-900">Questions fréquentes</h2>

      <div class="space-y-4 text-sm">
        <div>
          <p class="font-medium text-gray-900">
            Le message « Vendredi : heure de pointage requise » apparaît, pourquoi ?
          </p>
          <p class="mt-1 text-gray-700">
            Sur le vendredi, un segment a un pointage attendu dont l'heure est vide (affichée
            <code>--:--</code>). Renseignez l'heure, ou supprimez cette ligne de pointage avec la
            corbeille (la toute dernière ne peut pas être supprimée). Ensuite l'enregistrement passe.
          </p>
        </div>

        <div>
          <p class="font-medium text-gray-900">Pourquoi je ne peux pas choisir « Jour » ou « Nuit » ?</p>
          <p class="mt-1 text-gray-700">
            C'est volontaire : le type est déduit des heures pour éviter les erreurs. Changez les
            heures de Début/Fin et le type s'ajuste tout seul.
          </p>
        </div>

        <div>
          <p class="font-medium text-gray-900">J'ai plusieurs segments qui se ressemblent par erreur, que faire ?</p>
          <p class="mt-1 text-gray-700">
            Une journée normale n'a qu'un seul segment. S'il y en a plusieurs sans raison
            (clics répétés sur « Segment » ou « Copier vers… »), supprimez ceux en trop avec
            <strong>« Supprimer le segment »</strong>.
          </p>
        </div>

        <div>
          <p class="font-medium text-gray-900">Un employé a-t-il toujours l'horaire de son département ?</p>
          <p class="mt-1 text-gray-700">
            Par défaut oui. Mais si on lui attribue un horaire personnel, c'est celui-là qui
            s'applique en priorité.
          </p>
        </div>
      </div>
    </AppCard>

    <div class="mb-10">
      <AppButton variant="outline" size="sm" @click="goBack">
        <ArrowLeftIcon class="mr-2 inline h-4 w-4" />
        {{ t('common.back') }}
      </AppButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import {
  ArrowLeftIcon,
  QuestionMarkCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  BuildingOffice2Icon,
} from '@heroicons/vue/24/outline'

const { t } = useI18n()
const router = useRouter()

const goBack = () => {
  router.back()
}
</script>

<style scoped>
code {
  border-radius: 0.25rem;
  background-color: #f3f4f6;
  padding: 0.05rem 0.3rem;
  font-size: 0.85em;
}
</style>
