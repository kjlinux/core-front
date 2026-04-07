// Mode de remuneration
export type PaymentMode = 'monthly' | 'hourly' | 'daily' | 'weekly' | 'forfait'

// Regle de penalite retard
export interface LatenessRule {
  id: string
  companyId: string
  // delai de tolerance en minutes avant application de la penalite
  toleranceMinutes: number
  // nombre de minutes de retard cumule
  minutesThreshold: number
  // montant deduit en FCFA OU pourcentage selon penaltyType
  penaltyValue: number
  penaltyType: 'fixed' | 'percentage'
  // s'applique par occurrence ou par tranche
  applyPer: 'occurrence' | 'tranche'
  createdAt: string
  updatedAt: string
}

// Configuration de paie de l'entreprise
export interface PayrollConfig {
  id: string
  companyId: string
  // mode de paiement par defaut pour les nouveaux employes
  defaultPaymentMode: PaymentMode
  // nombre d'heures par jour de travail standard (pour mode horaire)
  standardDailyHours: number
  // nombre de jours ouvrables par mois (pour mode mensuel)
  workingDaysPerMonth: number
  // jour de versement de la paie (1-31)
  paymentDay: number
  // activer le calcul automatique des penalites retard
  latenessDeductionEnabled: boolean
  // activer les heures supplementaires
  overtimeEnabled: boolean
  // taux heure supplementaire (ex: 1.25 = +25%)
  overtimeRate: number
  latenessRules: LatenessRule[]
  createdAt: string
  updatedAt: string
}

// Fiche de paie d'un employe pour une periode
export interface PayslipLine {
  label: string
  type: 'earning' | 'deduction'
  amount: number
}

export interface Payslip {
  id: string
  employeeId: string
  employeeNumber: string
  employeeFirstName: string
  employeeLastName: string
  employeePosition: string
  companyId: string
  companyName: string
  siteId?: string
  siteName?: string
  departmentId?: string
  departmentName?: string
  period: string // format YYYY-MM
  periodStart: string
  periodEnd: string
  paymentMode: PaymentMode
  baseSalary: number
  // jours / heures travailles
  workedDays: number
  workedHours: number
  // absences
  absentDays: number
  // retards total en minutes
  totalLatenessMinutes: number
  // heures supplementaires
  overtimeHours: number
  overtimeAmount: number
  // deductions retard
  latenessDeduction: number
  // deductions absences
  absenceDeduction: number
  // autres lignes (primes, etc.)
  lines: PayslipLine[]
  grossAmount: number
  netAmount: number
  status: 'draft' | 'validated' | 'paid'
  generatedAt: string
}

// Parametre de generation en masse
export interface PayrollGenerateParams {
  companyId: string
  siteId?: string
  departmentId?: string
  periodStart: string // YYYY-MM-DD
  periodEnd: string   // YYYY-MM-DD
}

export interface PayrollConfigFilters {
  companyId?: string
}
