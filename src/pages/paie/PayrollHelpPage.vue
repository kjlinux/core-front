<template>
  <div class="payroll-help-page mx-auto max-w-3xl">
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
          <h1 class="text-2xl font-bold text-gray-900">Comment configurer la paie</h1>
          <p class="mt-1 text-sm text-gray-500">
            Un guide simple, avec des exemples chiffrés, pour régler la paie sans être expert.
          </p>
        </div>
      </div>
    </AppCard>

    <!-- C'est quoi la configuration de paie -->
    <AppCard class="mb-6">
      <h2 class="mb-2 flex items-center gap-2 text-lg font-semibold text-gray-900">
        <BanknotesIcon class="h-5 w-5 text-primary-700" /> À quoi sert cette page ?
      </h2>
      <p class="text-sm leading-relaxed text-gray-700">
        La configuration de paie indique au système <strong>comment calculer automatiquement le
        salaire</strong> de chaque employé à partir de ses <strong>pointages</strong> (badges au
        lecteur), de ses <strong>absences</strong> et de ses <strong>retards</strong>.
      </p>
      <p class="mt-2 text-sm leading-relaxed text-gray-700">
        Vous réglez ces paramètres <strong>une seule fois</strong> par entreprise. Ensuite, sur la
        page <strong>« Génération des fiches de paie »</strong>, il suffit de choisir une période et
        de cliquer sur un bouton : le système produit toutes les fiches d'un coup.
      </p>
      <div v-if="isSuperAdmin" class="mt-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
        <p>
          <strong>Astuce :</strong> comme vous gérez plusieurs entreprises, choisissez d'abord
          l'entreprise dans le menu déroulant en haut de la page. Chaque entreprise a sa propre
          configuration.
        </p>
      </div>
    </AppCard>

    <!-- Les 2 parties -->
    <AppCard class="mb-6">
      <h2 class="mb-3 text-lg font-semibold text-gray-900">Le formulaire en 2 parties</h2>
      <ol class="space-y-3">
        <li class="flex gap-3">
          <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-800 text-xs font-bold text-white">1</span>
          <span class="text-sm text-gray-700">
            <strong>Les paramètres généraux</strong> - comment l'employé est payé (au mois, à
            l'heure…), le nombre de jours travaillés, le jour de versement, les heures
            supplémentaires.
          </span>
        </li>
        <li class="flex gap-3">
          <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-800 text-xs font-bold text-white">2</span>
          <span class="text-sm text-gray-700">
            <strong>Les règles de pénalité retard</strong> - combien on retire du salaire quand un
            employé arrive en retard, et à partir de quand.
          </span>
        </li>
      </ol>
    </AppCard>

    <!-- Partie 1 : parametres generaux -->
    <AppCard class="mb-6">
      <h2 class="mb-3 text-lg font-semibold text-gray-900">1. Les paramètres généraux</h2>
      <dl class="space-y-3 text-sm">
        <div>
          <dt class="font-medium text-gray-900">Mode de rémunération par défaut</dt>
          <dd class="text-gray-700">
            La façon dont on paie l'employé. Cinq choix possibles :
            <ul class="mt-1 list-disc space-y-1 pl-5">
              <li><strong>Mensuel</strong> : un salaire fixe chaque mois (ex. 150 000 FCFA), quel que soit le nombre exact de jours.</li>
              <li><strong>Horaire</strong> : on paie un <em>taux par heure</em> × le nombre d'heures réellement badgées.</li>
              <li><strong>Journalier</strong> : on paie un <em>taux par jour</em> × le nombre de jours réellement travaillés.</li>
              <li><strong>Hebdomadaire</strong> : on paie à la semaine.</li>
              <li><strong>Forfait</strong> : un montant fixe convenu, sans calcul d'heures.</li>
            </ul>
            <p class="mt-1">
              C'est le mode utilisé par défaut. Si un employé a son propre mode (défini sur sa fiche),
              <strong>c'est le sien qui s'applique</strong>.
            </p>
          </dd>
        </div>
        <div>
          <dt class="font-medium text-gray-900">Heures / jour standard (ex. 8)</dt>
          <dd class="text-gray-700">
            Le nombre d'heures d'une journée normale de travail. Sert surtout au calcul des heures
            supplémentaires en mode horaire.
          </dd>
        </div>
        <div>
          <dt class="font-medium text-gray-900">Jours ouvrables / mois (ex. 26)</dt>
          <dd class="text-gray-700">
            Le nombre de jours travaillés attendus dans un mois. Sert à calculer le
            <strong>salaire d'une journée</strong> (salaire ÷ jours ouvrables) et donc combien
            retirer pour chaque jour d'absence.
          </dd>
        </div>
        <div>
          <dt class="font-medium text-gray-900">Jour de versement de la paie (ex. 28)</dt>
          <dd class="text-gray-700">
            Le jour du mois où le salaire est versé. Par exemple 28 = le 28 de chaque mois.
          </dd>
        </div>
        <div>
          <dt class="font-medium text-gray-900">Heures supplémentaires + Taux majoré</dt>
          <dd class="text-gray-700">
            Si vous activez l'option, les heures faites <strong>au-delà</strong> de l'horaire normal
            sont mieux payées. Le <strong>taux majoré</strong> est un multiplicateur : <strong>1,25</strong>
            veut dire « +25 % » sur ces heures. Cette option ne s'applique qu'aux employés payés
            <strong>à l'heure</strong>.
          </dd>
        </div>
      </dl>

      <div class="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        <p class="flex items-center gap-2 font-medium">
          <ExclamationTriangleIcon class="h-5 w-5" /> Les absences sont déduites automatiquement
        </p>
        <p class="mt-1">
          Un jour où l'employé devait travailler mais n'a pas pointé compte comme une absence : on
          retire un jour de salaire. <strong>Les congés approuvés ne sont pas comptés comme des
          absences</strong> et ne sont donc pas pénalisés.
        </p>
      </div>
    </AppCard>

    <!-- Partie 2 : regles de retard -->
    <AppCard class="mb-6">
      <h2 class="mb-3 text-lg font-semibold text-gray-900">2. Les règles de pénalité retard</h2>

      <p class="mb-3 text-sm leading-relaxed text-gray-700">
        Une règle dit : « <strong>au-delà de tant de minutes de retard cumulé sur le mois, on retire
        tant</strong> ». Vous pouvez créer plusieurs règles. Pour chaque règle, vous renseignez :
      </p>

      <dl class="space-y-3 text-sm">
        <div>
          <dt class="font-medium text-gray-900">Tolérance (min)</dt>
          <dd class="text-gray-700">
            Le petit délai « gratuit » avant de commencer à compter. Avec une tolérance de
            <strong>5 minutes</strong>, les 5 premières minutes de retard ne sont jamais pénalisées.
          </dd>
        </div>
        <div>
          <dt class="font-medium text-gray-900">Seuil (min)</dt>
          <dd class="text-gray-700">
            À partir de combien de minutes (après la tolérance) la pénalité se déclenche. Avec un
            seuil de <strong>15 minutes</strong>, la pénalité ne s'applique qu'à partir de 15 minutes
            de retard.
          </dd>
        </div>
        <div>
          <dt class="font-medium text-gray-900">Pénalité</dt>
          <dd class="text-gray-700">Le montant à retirer (ex. 1 000), en FCFA ou en pourcentage selon le type ci-dessous.</dd>
        </div>
        <div>
          <dt class="font-medium text-gray-900">Type</dt>
          <dd class="text-gray-700">
            <strong>Montant fixe (FCFA)</strong> : on retire une somme en francs.
            <strong>Pourcentage</strong> : on retire un pourcentage du <em>salaire journalier</em>.
          </dd>
        </div>
        <div>
          <dt class="font-medium text-gray-900">Application : par occurrence ou par tranche</dt>
          <dd class="text-gray-700">
            <strong>Par occurrence</strong> : la pénalité s'applique <em>une seule fois</em> dès que
            le seuil est atteint. <strong>Par tranche</strong> : la pénalité s'applique
            <em>autant de fois</em> que le seuil est dépassé (chaque « paquet » de minutes).
          </dd>
        </div>
      </dl>

      <div class="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
        <p class="font-medium">Exemple chiffré complet</p>
        <p class="mt-1">
          Règle : tolérance <strong>5 min</strong>, seuil <strong>15 min</strong>, pénalité
          <strong>1 000 FCFA</strong>, type <strong>montant fixe</strong>, application
          <strong>par tranche</strong>.
        </p>
        <ul class="mt-2 list-disc space-y-1 pl-5">
          <li>Un employé cumule <strong>45 minutes</strong> de retard sur le mois.</li>
          <li>On enlève la tolérance : 45 − 5 = <strong>40 minutes</strong> à pénaliser.</li>
          <li>Par tranche de 15 min : 40 ÷ 15 = <strong>2 tranches</strong> complètes.</li>
          <li>Déduction : 2 × 1 000 = <strong>2 000 FCFA</strong>.</li>
        </ul>
        <p class="mt-2">
          Avec l'application <strong>« par occurrence »</strong>, on n'aurait retiré qu'une seule fois
          1 000 FCFA, peu importe le nombre de tranches.
        </p>
      </div>

      <div class="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
        <p class="font-medium text-gray-900">Bon à savoir</p>
        <p class="mt-1">
          La déduction retard <strong>ne dépasse jamais le salaire</strong> de l'employé. Et si vous
          désactivez l'interrupteur « Activer les déductions automatiques pour retard », aucune
          pénalité n'est appliquée, même si des règles existent.
        </p>
      </div>
    </AppCard>

    <!-- Comment generer -->
    <AppCard class="mb-6">
      <h2 class="mb-2 flex items-center gap-2 text-lg font-semibold text-gray-900">
        <DocumentTextIcon class="h-5 w-5 text-primary-700" /> Comment générer les fiches ensuite
      </h2>
      <ol class="space-y-2 text-sm text-gray-700">
        <li>1. Allez sur <strong>Paie → Génération des fiches de paie</strong>.</li>
        <li>2. Choisissez la <strong>période</strong> (du… au…). Par défaut, le mois en cours est déjà rempli.</li>
        <li>3. (Facultatif) Limitez à un <strong>site</strong> ou un <strong>département</strong> précis.</li>
        <li>4. Cliquez sur <strong>« Générer les fiches »</strong>. Le tableau affiche le brut, les déductions et le net de chaque employé.</li>
        <li>5. Vérifiez, puis <strong>« Validez »</strong> chaque fiche et/ou <strong>exportez en PDF</strong>.</li>
      </ol>
    </AppCard>

    <!-- FAQ -->
    <AppCard class="mb-6">
      <h2 class="mb-4 text-lg font-semibold text-gray-900">Questions fréquentes</h2>

      <div class="space-y-4 text-sm">
        <div v-if="isSuperAdmin">
          <p class="font-medium text-gray-900">Pourquoi on me demande de choisir une entreprise ?</p>
          <p class="mt-1 text-gray-700">
            Vous gérez plusieurs entreprises et chacune a sa propre paie : il faut donc d'abord
            indiquer laquelle, via le menu déroulant en haut de la page. La configuration et les
            fiches affichées concernent uniquement l'entreprise sélectionnée.
          </p>
        </div>

        <div>
          <p class="font-medium text-gray-900">Un employé sans aucun pointage est-il payé ?</p>
          <p class="mt-1 text-gray-700">
            En mode <strong>mensuel</strong> ou <strong>forfait</strong>, le salaire de base reste,
            mais les jours d'absence sont déduits. En mode <strong>horaire</strong> ou
            <strong>journalier</strong>, on ne paie que ce qui a été réellement travaillé : sans
            pointage, le montant peut être nul.
          </p>
        </div>

        <div>
          <p class="font-medium text-gray-900">Les congés approuvés comptent-ils comme des absences ?</p>
          <p class="mt-1 text-gray-700">
            Non. Les jours de congé validés sont retirés du calcul des absences : ils ne sont ni
            déduits du salaire, ni considérés comme du retard.
          </p>
        </div>

        <div>
          <p class="font-medium text-gray-900">Pourquoi les heures supplémentaires ne s'appliquent pas à mes employés mensuels ?</p>
          <p class="mt-1 text-gray-700">
            Le calcul des heures sup a besoin d'un <strong>taux horaire</strong>. Il ne concerne donc
            que les employés payés à l'heure. Pour les mensuels, le salaire est fixe.
          </p>
        </div>

        <div>
          <p class="font-medium text-gray-900">Je modifie une règle de retard : les anciennes fiches changent-elles ?</p>
          <p class="mt-1 text-gray-700">
            Non. Les modifications s'appliquent aux <strong>prochaines générations</strong>. Pour
            recalculer un mois déjà fait, relancez la génération sur cette période.
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
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth.store'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import {
  ArrowLeftIcon,
  QuestionMarkCircleIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
} from '@heroicons/vue/24/outline'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()

const isSuperAdmin = computed(() => authStore.user?.role === 'super_admin')

const goBack = () => {
  router.back()
}
</script>
