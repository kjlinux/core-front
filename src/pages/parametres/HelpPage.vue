<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { UserRole } from '@/types/enums'
import AppCard from '@/components/ui/AppCard.vue'
import {
  CreditCardIcon,
  QrCodeIcon,
  FingerPrintIcon,
  FaceSmileIcon,
  ShoppingCartIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from '@heroicons/vue/24/outline'

const auth = useAuthStore()
const isTechnicien = computed(() => auth.user?.role === UserRole.TECHNICIEN)
const isAdminOrSuper = computed(
  () =>
    auth.user?.role === UserRole.SUPER_ADMIN ||
    auth.user?.role === UserRole.ADMIN_ENTERPRISE,
)

const searchQuery = ref('')
const expandedSections = ref<Set<string>>(new Set())
const expandedItems = ref<Set<string>>(new Set())

function toggleSection(id: string) {
  if (expandedSections.value.has(id)) {
    expandedSections.value.delete(id)
  } else {
    expandedSections.value.add(id)
  }
}

function toggleItem(id: string) {
  if (expandedItems.value.has(id)) {
    expandedItems.value.delete(id)
  } else {
    expandedItems.value.add(id)
  }
}

function isSectionExpanded(id: string) {
  return expandedSections.value.has(id)
}

function isItemExpanded(id: string) {
  return expandedItems.value.has(id)
}

interface HelpItem {
  id: string
  question: string
  answer: string
  useCases?: string[]
  steps?: string[]
}

interface HelpSection {
  id: string
  title: string
  description: string
  icon: unknown
  color: string
  items: HelpItem[]
  roles?: string[]
}

const sections: HelpSection[] = [
  {
    id: 'pointage-rfid',
    title: 'Pointage RFID',
    description: 'Gestion des présences par badges RFID pour vos employés',
    icon: CreditCardIcon,
    color: 'text-blue-600',
    items: [
      {
        id: 'rfid-intro',
        question: "C'est quoi le Pointage RFID ?",
        answer:
          "Le Pointage RFID est le module principal de gestion des présences. Il permet à vos employés de pointer leurs entrées et sorties en passant leur badge RFID devant un lecteur installé à l'entrée de votre lieu de travail. Toutes les présences sont enregistrées automatiquement, consultables en temps réel et exportables sous forme de rapports.",
        useCases: [
          'Un employé arrive au bureau et passe son badge : le système enregistre son heure d\'arrivée.',
          'Le responsable RH veut savoir qui est absent aujourd\'hui : il consulte la liste des présences en temps réel.',
          "En fin de mois, le service comptabilité a besoin des heures travaillées : il génère un rapport mensuel.",
        ],
      },
      {
        id: 'rfid-sites',
        question: 'Comment gérer les sites ?',
        answer:
          "Un site représente un lieu physique de votre entreprise (siège social, agence, entrepôt...). Chaque site possède ses propres lecteurs RFID et ses propres employés affectés. Pour créer un site, allez dans Pointage RFID > Sites puis cliquez sur \"Nouveau site\". Renseignez le nom, l'adresse et les informations de contact.",
        steps: [
          'Allez dans Pointage RFID > Sites',
          'Cliquez sur "Nouveau site"',
          'Renseignez le nom du site et son adresse',
          'Enregistrez — le site apparaît immédiatement dans la liste',
        ],
        useCases: [
          "Votre entreprise a un siège à Ouagadougou et une agence à Bobo-Dioulasso : créez deux sites distincts.",
          "Vous souhaitez suivre séparément les présences par lieu : affectez chaque employé à son site principal.",
        ],
      },
      {
        id: 'rfid-departments',
        question: 'Comment organiser les départements ?',
        answer:
          "Les départements permettent de regrouper vos employés par service (Comptabilité, Ressources Humaines, Informatique, Commercial...). Chaque département appartient à un site. Cela vous permet de filtrer les rapports et les présences par service.",
        steps: [
          'Allez dans Pointage RFID > Départements',
          'Cliquez sur "Nouveau département"',
          'Choisissez le site auquel il appartient',
          'Donnez un nom au département et enregistrez',
        ],
        useCases: [
          "Vous voulez voir uniquement les absences du département Comptabilité ce mois-ci.",
          "Un responsable de service veut suivre les heures de son équipe uniquement.",
        ],
      },
      {
        id: 'rfid-employees',
        question: 'Comment ajouter et gérer les employés ?',
        answer:
          "La fiche employé contient toutes les informations nécessaires au pointage : nom, prénom, matricule, département, site d'affectation, et le badge RFID associé. Un employé peut être actif ou inactif. Un employé inactif ne peut plus pointer.",
        steps: [
          'Allez dans Pointage RFID > Employés',
          'Cliquez sur "Nouvel employé"',
          'Renseignez les informations personnelles et professionnelles',
          'Affectez-le à un site et un département',
          'Enregistrez — vous pourrez ensuite lui attribuer un badge',
        ],
        useCases: [
          "Un nouveau collaborateur rejoint l'entreprise : créez sa fiche et attribuez-lui un badge.",
          "Un employé quitte l'entreprise : désactivez sa fiche pour bloquer tout pointage futur.",
          "Un employé change de département : modifiez son affectation directement depuis sa fiche.",
        ],
      },
      {
        id: 'rfid-cards',
        question: 'Comment gérer les badges RFID ?',
        answer:
          "Chaque badge RFID a un identifiant unique (UID). Vous devez d'abord enregistrer les badges dans le système, puis les attribuer aux employés. Un badge peut être actif, inactif ou perdu. En cas de perte, désactivez immédiatement le badge et en attribuez un nouveau à l'employé.",
        steps: [
          'Allez dans Pointage RFID > Badges',
          'Cliquez sur "Nouveau badge" et saisissez son UID (affiché sur le badge)',
          'Une fois créé, allez sur la fiche de l\'employé concerné',
          'Associez le badge à l\'employé',
        ],
        useCases: [
          "Un employé perd son badge : marquez l'ancien comme \"perdu\" et attribuez-lui un nouveau.",
          "Vous recevez un lot de nouveaux badges : enregistrez-les tous avant de les distribuer.",
        ],
      },
      {
        id: 'rfid-schedules',
        question: 'Comment configurer les horaires de travail ?',
        answer:
          "Les horaires définissent les plages de travail attendues pour vos employés (ex. 08h00 - 17h00). Vous pouvez créer plusieurs types d'horaires (temps plein, temps partiel, equipe du matin, equipe du soir...) et les associer à des groupes d'employés. Le système compare ensuite les pointages réels aux horaires attendus pour détecter les retards et absences.",
        steps: [
          'Allez dans Pointage RFID > Horaires',
          'Cliquez sur "Nouvel horaire"',
          'Définissez l\'heure d\'entrée et de sortie pour chaque jour de la semaine',
          'Donnez un nom à cet horaire (ex. "Journée standard")',
          'Associez cet horaire aux employés concernés',
        ],
        useCases: [
          "Certains employés travaillent de 8h à 17h, d'autres de 7h à 15h : créez deux horaires distincts.",
          "Vous voulez savoir combien de minutes de retard a cumulé un employé ce mois : consultez les rapports en filtrant par employé.",
        ],
      },
      {
        id: 'rfid-attendance',
        question: 'Comment consulter les présences ?',
        answer:
          "La page Présences affiche en temps réel tous les pointages de la journée ou d'une période choisie. Vous pouvez filtrer par site, département, employé et période. Chaque enregistrement indique l'heure d'entrée, l'heure de sortie, le statut (présent, retard, absence) et la durée travaillée.",
        useCases: [
          "Il est 9h30 et vous voulez voir qui est déjà arrivé : consultez les présences du jour en cours.",
          "Un employé conteste une absence : recherchez ses pointages sur la période concernée pour vérifier.",
          "En fin de semaine, exportez les présences pour le suivi RH.",
        ],
      },
      {
        id: 'rfid-reports',
        question: 'Comment générer les rapports de présences ?',
        answer:
          "Les rapports vous permettent d'obtenir un récapitulatif complet des présences sur une période donnée. Vous pouvez générer des rapports par employé, par département ou pour toute l'entreprise. Les rapports sont exportables en PDF ou Excel.",
        steps: [
          'Allez dans Pointage RFID > Rapports',
          'Sélectionnez la période (semaine, mois, période personnalisée)',
          'Choisissez le périmètre : tous les employés, un département ou un employé précis',
          'Cliquez sur "Générer le rapport"',
          'Exportez en PDF ou Excel selon votre besoin',
        ],
        useCases: [
          "Fin de mois : générez le rapport mensuel de présences pour la paie.",
          "Un client demande une justification des heures de votre équipe sur son projet : exportez le rapport en PDF.",
        ],
      },
    ],
  },
  {
    id: 'pointage-qrcode',
    title: 'Pointage QR Code',
    description: 'Pointage des présences via QR Code sur téléphone mobile',
    icon: QrCodeIcon,
    color: 'text-indigo-600',
    items: [
      {
        id: 'qr-intro',
        question: "C'est quoi le Pointage QR Code ?",
        answer:
          "Le Pointage QR Code est une alternative au badge RFID. Au lieu d'un lecteur physique, un QR Code est affiché à l'entrée du site (imprimé ou sur écran). L'employé scanne ce QR Code avec son téléphone mobile enregistré dans le système pour pointer son entrée ou sa sortie.",
        useCases: [
          "Vos employés n'ont pas de badge RFID mais ont tous un smartphone : utilisez le pointage QR Code.",
          "Vous souhaitez un mode de pointage sans installation de matériel physique.",
        ],
      },
      {
        id: 'qr-enroll',
        question: "Comment enregistrer les téléphones des employés ?",
        answer:
          "Avant de pouvoir pointer via QR Code, le téléphone de chaque employé doit être enregistré (enrôlé) dans le système. Cela garantit que seul le téléphone autorisé peut effectuer le pointage, évitant toute fraude.",
        steps: [
          'Allez dans Pointage QR Code > Enrolement téléphones',
          'Cliquez sur "Enroler un téléphone"',
          'Associez le téléphone à un employé existant',
          'Suivez la procédure d\'activation sur le téléphone de l\'employé',
        ],
        useCases: [
          "Un employé change de téléphone : désactivez l'ancien appareil et enrolez le nouveau.",
          "Vous voulez que seul le téléphone personnel de l'employé puisse pointer en son nom.",
        ],
      },
      {
        id: 'qr-generate',
        question: "Comment générer les QR Codes de pointage ?",
        answer:
          "Un QR Code est généré pour chaque site ou point de contrôle. Ce QR Code est affiché à l'entrée. Il peut être régénéré à tout moment pour des raisons de sécurité (par exemple si le QR Code a été photographié par une personne non autorisée).",
        steps: [
          'Allez dans Pointage QR Code > Générer QR Codes',
          'Sélectionnez le site concerné',
          'Cliquez sur "Générer" — le QR Code apparaît à l\'écran',
          'Imprimez-le ou affichez-le sur un écran à l\'entrée du site',
        ],
      },
    ],
  },
  {
    id: 'biometrique',
    title: 'Biometrique',
    description: 'Contrôle d\'accès et pointage par empreinte digitale',
    icon: FingerPrintIcon,
    color: 'text-purple-600',
    items: [
      {
        id: 'bio-intro',
        question: "C'est quoi le module Biométrique ?",
        answer:
          "Le module Biométrique permet le contrôle d'accès et le pointage via empreinte digitale. C'est la solution la plus sécurisée car elle utilise une caractéristique unique à chaque personne. Un terminal biométrique est installé à l'entrée : l'employé pose son doigt et le système identifie instantanément qui est présent.",
        useCases: [
          "Zones à accès restreint (serveur, coffre, laboratoire) : seules les empreintes autorisées peuvent entrer.",
          "Elimination totale du badgeage frauduleux : impossible de pointer pour quelqu'un d'autre.",
        ],
      },
      {
        id: 'bio-enrollment',
        question: "Comment enregistrer les empreintes digitales ?",
        answer:
          "L'enrôlement biométrique consiste à capturer et enregistrer les empreintes digitales d'un employé dans le terminal. Cette opération est réalisée une seule fois par employé. Il est recommandé d'enregistrer plusieurs doigts (index droit et gauche au minimum) en cas de blessure.",
        steps: [
          'Allez dans Biométrique > Enrôlement',
          'Sélectionnez l\'employé à enrôler',
          'Sur le terminal, demandez à l\'employé de poser son doigt plusieurs fois',
          'Validez l\'enrôlement — l\'empreinte est stockée de façon sécurisée',
        ],
        useCases: [
          "Un nouveau collaborateur arrive : enrôlez ses empreintes dès son premier jour.",
          "Un employé a une coupure au doigt habituel : enrôlez un autre doigt temporairement.",
        ],
      },
      {
        id: 'bio-devices',
        question: "Comment gérer les terminaux biométriques ?",
        answer:
          "La page Appareils liste tous les terminaux biométriques connectés à votre système. Vous pouvez voir l'état de chaque terminal (en ligne / hors ligne), sa dernière synchronisation et les informations techniques. Un terminal hors ligne n'enverra pas les pointages au système central.",
        useCases: [
          "Un terminal affiche \"hors ligne\" depuis ce matin : vérifiez sa connexion réseau.",
          "Vous installez un nouveau terminal dans une nouvelle agence : déclarez-le dans le système.",
        ],
      },
      {
        id: 'bio-attendance',
        question: "Comment consulter les présences biométriques ?",
        answer:
          "La page Présences du module Biométrique fonctionne exactement comme celle du Pointage RFID, mais les données proviennent des terminaux biométriques. Vous visualisez les entrées/sorties horodatées de chaque employé.",
      },
    ],
  },
  {
    id: 'feelback',
    title: 'Feelback',
    description: 'Collecte et analyse des avis clients en temps réel',
    icon: FaceSmileIcon,
    color: 'text-yellow-600',
    items: [
      {
        id: 'fb-intro',
        question: "C'est quoi le module Feelback ?",
        answer:
          "Feelback est un système de collecte d'avis clients. Des bornes interactives ou des QR Codes sont installés à des points stratégiques (sortie de caisse, salle d'attente, réception...). Les clients donnent leur avis en appuyant simplement sur un bouton : Bon, Neutre ou Mauvais. Les résultats sont analysés en temps réel dans votre tableau de bord.",
        useCases: [
          "Une banque place une borne en sortie de guichet : les clients notent la qualité du service immédiatement après interaction.",
          "Un supermarché surveille la satisfaction en caisse par heure pour détecter les pics d'insatisfaction.",
          "Un hôtel mesure la satisfaction à la réception et dans les différents services.",
        ],
      },
      {
        id: 'fb-dashboard',
        question: "Comment lire le tableau de bord Feelback ?",
        answer:
          "Le tableau de bord affiche en temps réel le nombre d'avis collectés, le taux de satisfaction global et son évolution dans le temps. Vous verrez des graphiques par heure, par jour et par borne. Un taux vert indique une bonne satisfaction, orange signifie des problèmes à investiguer, rouge nécessite une action immédiate.",
        useCases: [
          "Il est 14h et votre taux de satisfaction chute brusquement : vérifiez ce qui se passe à ce moment (changement d'agent, incident technique...).",
          "Vous comparez la satisfaction entre vos différentes agences pour identifier la meilleure et partager ses bonnes pratiques.",
        ],
      },
      {
        id: 'fb-analytics',
        question: "Comment analyser les tendances ?",
        answer:
          "La page Analytiques vous donne une vue approfondie des données : évolution sur plusieurs semaines, comparaison par borne, identification des créneaux horaires problématiques, et analyse par agents si vous avez activé le suivi par agent.",
        useCases: [
          "Vous constatez que les lundis matin ont toujours une satisfaction plus faible : vous pouvez renforcer les effectifs ce créneau.",
          "Un agent particulier reçoit systématiquement de mauvaises notes : c'est un signal pour un accompagnement.",
        ],
      },
      {
        id: 'fb-agents',
        question: "Comment configurer le suivi par agent ?",
        answer:
          "Si votre borne ou QR Code est utilisé par plusieurs agents (conseillers, caissiers...), vous pouvez activer le mode \"agent\" : chaque agent s'identifie au début de son service. Les avis collectés durant son service lui sont alors attribués. Cela permet un suivi individualisé de la satisfaction.",
        steps: [
          'Allez dans Feelback > Agents',
          'Créez les profils de vos agents',
          'Sur la borne, activez le mode agent',
          'Chaque agent se connecte en début de service',
        ],
      },
      {
        id: 'fb-alerts',
        question: "Comment configurer les alertes ?",
        answer:
          "Les alertes vous préviennent automatiquement lorsque la satisfaction descend sous un seuil que vous définissez (ex. moins de 60% de bon en 30 minutes). Vous recevez une notification dans l'application pour réagir rapidement avant que la situation ne se dégrade.",
        steps: [
          'Allez dans Feelback > Alertes',
          'Cliquez sur "Nouvelle alerte"',
          'Définissez le seuil de déclenchement (ex. taux de satisfaction < 60%)',
          'Choisissez la borne ou le site concerné',
          'Enregistrez — l\'alerte se déclenche automatiquement si le seuil est atteint',
        ],
        useCases: [
          "Vous êtes responsable de plusieurs sites et ne pouvez pas surveiller chaque tableau de bord en permanence : les alertes vous notifient des anomalies.",
        ],
      },
      {
        id: 'fb-qravis',
        question: "Comment utiliser les QR Codes d'avis ?",
        answer:
          "En complément des bornes physiques, Feelback génère des QR Codes que vous pouvez imprimer et afficher partout. Les clients scannent le QR Code avec leur téléphone et donnent leur avis directement depuis leur smartphone, sans installer d'application.",
        useCases: [
          "Placez un QR Code sur les tables d'un restaurant pour collecter les avis en fin de repas.",
          "Intégrez le QR Code dans vos emails de confirmation de commande ou vos factures.",
        ],
      },
      {
        id: 'fb-reports',
        question: "Comment exporter les rapports Feelback ?",
        answer:
          "La page Rapports vous permet de générer et exporter un récapitulatif de la satisfaction sur une période. Choisissez la période, le site ou la borne, puis exportez en PDF pour vos réunions de direction ou en Excel pour une analyse approfondie.",
      },
    ],
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    description: 'Commande de matériel et équipements directement depuis l\'application',
    icon: ShoppingCartIcon,
    color: 'text-green-600',
    items: [
      {
        id: 'mp-intro',
        question: "C'est quoi la Marketplace ?",
        answer:
          "La Marketplace vous permet de commander directement depuis l'application les équipements dont vous avez besoin : lecteurs RFID, badges, terminaux biométriques, bornes Feelback, câbles, etc. Plus besoin de passer par un commercial : parcourez le catalogue, ajoutez au panier et passez votre commande en quelques clics.",
        useCases: [
          "Vous avez besoin de 50 nouveaux badges RFID pour vos nouvelles recrues : commandez-les directement depuis la Marketplace.",
          "Vous souhaitez installer une borne Feelback dans une nouvelle agence : trouvez le modèle qui vous convient et commandez.",
        ],
      },
      {
        id: 'mp-order',
        question: "Comment passer une commande ?",
        answer:
          "Parcourez le catalogue, consultez les fiches produits avec photos et descriptions techniques, puis ajoutez les articles souhaités à votre panier. Une fois votre sélection faite, validez la commande et procédez au paiement via LigdiCash.",
        steps: [
          'Allez dans Marketplace > Catalogue',
          'Parcourez les catégories ou utilisez la recherche',
          'Cliquez sur un produit pour voir sa fiche détaillée',
          'Choisissez la quantité et cliquez sur "Ajouter au panier"',
          'Allez dans votre panier et vérifiez votre commande',
          'Cliquez sur "Passer la commande" et suivez les étapes de paiement',
        ],
      },
      {
        id: 'mp-orders-track',
        question: "Comment suivre mes commandes ?",
        answer:
          "La page Mes Commandes liste toutes vos commandes passées avec leur statut (En attente, Confirmée, En préparation, Expédiée, Livrée). Vous pouvez consulter le détail de chaque commande : articles commandés, montant, date et état de livraison.",
        useCases: [
          "Vous avez passé une commande il y a 3 jours et n'avez pas eu de nouvelles : vérifiez le statut dans Mes Commandes.",
          "Vous voulez retrouver la référence d'un équipement commandé le mois dernier : consultez l'historique de vos commandes.",
        ],
      },
      {
        id: 'mp-payment',
        question: "Comment fonctionne le paiement ?",
        answer:
          "Le paiement se fait via LigdiCash, une solution de paiement mobile sécurisée. Vous pouvez payer par Mobile Money (Orange Money, Moov Money...). Le paiement est sécurisé et vous recevez une confirmation immédiate après validation.",
        steps: [
          'Depuis votre panier, cliquez sur "Passer la commande"',
          'Vérifiez le récapitulatif de votre commande',
          'Cliquez sur "Payer avec LigdiCash"',
          'Saisissez votre numéro Mobile Money et validez',
          'Confirmez le paiement sur votre téléphone (code OTP)',
          'Vous recevez une confirmation et votre commande est enregistrée',
        ],
      },
    ],
  },
  {
    id: 'parametres',
    title: 'Paramètres',
    description: 'Configuration de votre compte, de votre entreprise et des utilisateurs',
    icon: Cog6ToothIcon,
    color: 'text-gray-600',
    items: [
      {
        id: 'param-profile',
        question: "Comment modifier mon profil ?",
        answer:
          "La page Profil vous permet de mettre à jour vos informations personnelles (nom, prénom, email) et de changer votre mot de passe. Il est recommandé de changer votre mot de passe régulièrement pour la sécurité de votre compte.",
        steps: [
          'Allez dans Paramètres > Mon profil',
          'Modifiez vos informations personnelles',
          'Cliquez sur "Enregistrer" pour valider',
          'Pour changer le mot de passe, renseignez l\'ancien puis le nouveau (deux fois)',
        ],
      },
      {
        id: 'param-company',
        question: "Comment configurer les paramètres de mon entreprise ?",
        answer:
          "La page Entreprise (accessible aux administrateurs) vous permet de renseigner les informations officielles de votre entreprise : raison sociale, adresse, logo, contacts. Ces informations apparaissent sur les rapports et documents générés par l'application.",
        useCases: [
          "Votre entreprise déménage : mettez à jour l'adresse dans les paramètres entreprise.",
          "Vous venez de changer de logo : importez le nouveau logo pour qu'il apparaisse sur vos rapports.",
        ],
      },
      {
        id: 'param-users',
        question: "Comment gérer les utilisateurs de l'application ?",
        answer:
          "La page Utilisateurs vous permet de créer des comptes pour vos collaborateurs qui auront accès à l'application. Chaque utilisateur a un rôle qui détermine ce qu'il peut voir et faire. Vous pouvez activer ou désactiver un compte à tout moment.",
        steps: [
          'Allez dans Paramètres > Utilisateurs',
          'Cliquez sur "Nouvel utilisateur"',
          'Renseignez le nom, prénom, email et choisissez un rôle',
          'Enregistrez — l\'utilisateur reçoit ses identifiants par email',
        ],
        useCases: [
          "Un nouveau responsable RH rejoint votre équipe : créez-lui un compte avec le rôle Manager.",
          "Un employé quitte l'entreprise : désactivez immédiatement son compte pour sécuriser l'accès.",
        ],
      },
      {
        id: 'param-roles',
        question: "C'est quoi les rôles et comment les utiliser ?",
        answer:
          "Les rôles définissent les permissions de chaque utilisateur dans l'application. Il y a trois rôles principaux : Administrateur Entreprise (accès complet à son entreprise), Manager (accès en lecture et consultation des données). Attribuez le rôle approprié à chaque utilisateur selon ses responsabilités.",
        useCases: [
          "Votre directeur général doit tout voir mais pas modifier : donnez-lui le rôle Manager.",
          "Votre responsable RH doit gérer les employés et générer les rapports : donnez-lui le rôle Administrateur.",
          "Un chef d'équipe doit uniquement consulter les présences de son équipe : rôle Manager.",
        ],
      },
    ],
  },
]

const filteredSections = computed(() => {
  if (!searchQuery.value.trim()) return sections

  const query = searchQuery.value.toLowerCase().trim()
  return sections
    .map((section) => {
      const filteredItems = section.items.filter(
        (item) =>
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query) ||
          (item.useCases ?? []).some((uc) => uc.toLowerCase().includes(query)) ||
          (item.steps ?? []).some((s) => s.toLowerCase().includes(query)),
      )
      return { ...section, items: filteredItems }
    })
    .filter((section) => section.items.length > 0)
})

function expandAll() {
  sections.forEach((section) => {
    expandedSections.value.add(section.id)
    section.items.forEach((item) => expandedItems.value.add(item.id))
  })
}

function collapseAll() {
  expandedSections.value.clear()
  expandedItems.value.clear()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Centre d'aide</h1>
      <p class="mt-1 text-sm text-gray-500">
        Retrouvez ici le guide complet d'utilisation de l'application TANGAFLOW.
      </p>
    </div>

    <!-- Search + actions -->
    <AppCard>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div class="relative flex-1">
          <MagnifyingGlassIcon
            class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher dans l'aide..."
            class="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div class="flex gap-2">
          <button
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            @click="expandAll"
          >
            Tout développer
          </button>
          <button
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            @click="collapseAll"
          >
            Tout réduire
          </button>
        </div>
      </div>
    </AppCard>

    <!-- No results -->
    <div v-if="filteredSections.length === 0" class="py-12 text-center text-gray-500">
      Aucun résultat pour "{{ searchQuery }}". Essayez d'autres mots-clés.
    </div>

    <!-- Sections -->
    <div v-for="section in filteredSections" :key="section.id" class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <!-- Section header -->
      <button
        class="flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-gray-50"
        @click="toggleSection(section.id)"
      >
        <div :class="['flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100', section.color]">
          <component :is="section.icon" class="h-5 w-5" />
        </div>
        <div class="flex-1">
          <h2 class="text-base font-semibold text-gray-900">{{ section.title }}</h2>
          <p class="text-sm text-gray-500">{{ section.description }}</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            {{ section.items.length }} article{{ section.items.length > 1 ? 's' : '' }}
          </span>
          <ChevronDownIcon
            :class="['h-5 w-5 text-gray-400 transition-transform', isSectionExpanded(section.id) ? 'rotate-180' : '']"
          />
        </div>
      </button>

      <!-- Section items -->
      <div v-if="isSectionExpanded(section.id)" class="divide-y divide-gray-100 border-t border-gray-100">
        <div v-for="item in section.items" :key="item.id">
          <!-- Item question -->
          <button
            class="flex w-full items-start gap-3 px-6 py-4 text-left transition-colors hover:bg-gray-50"
            @click="toggleItem(item.id)"
          >
            <ChevronRightIcon
              :class="['mt-0.5 h-4 w-4 shrink-0 text-gray-400 transition-transform', isItemExpanded(item.id) ? 'rotate-90' : '']"
            />
            <span class="text-sm font-medium text-gray-800">{{ item.question }}</span>
          </button>

          <!-- Item answer -->
          <div v-if="isItemExpanded(item.id)" class="px-6 pb-5 pl-[3.25rem]">
            <!-- Main answer -->
            <p class="text-sm leading-relaxed text-gray-600">{{ item.answer }}</p>

            <!-- Steps -->
            <div v-if="item.steps && item.steps.length" class="mt-4">
              <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Etapes à suivre
              </p>
              <ol class="space-y-2">
                <li
                  v-for="(step, idx) in item.steps"
                  :key="idx"
                  class="flex items-start gap-3 text-sm text-gray-600"
                >
                  <span
                    class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
                  >
                    {{ idx + 1 }}
                  </span>
                  {{ step }}
                </li>
              </ol>
            </div>

            <!-- Use cases -->
            <div v-if="item.useCases && item.useCases.length" class="mt-4">
              <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Exemples concrets
              </p>
              <ul class="space-y-2">
                <li
                  v-for="(uc, idx) in item.useCases"
                  :key="idx"
                  class="flex items-start gap-2 text-sm text-gray-600"
                >
                  <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"></span>
                  {{ uc }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="rounded-xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-700">
      <p class="font-semibold">Vous n'avez pas trouvé la réponse à votre question ?</p>
      <p class="mt-1 text-blue-600">
        Contactez notre support technique en précisant votre nom d'entreprise, le module concerné
        et une description détaillée de votre problème. Cela nous permettra de vous répondre plus
        rapidement.
      </p>
    </div>
  </div>
</template>
