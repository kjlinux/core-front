/**
 * Point d'entrée public du mode démo.
 *
 * Le mode démo permet à un prospect de tester l'application (admin entreprise,
 * manager, employé) avec un jeu de données factices entièrement géré côté
 * frontend. Aucune donnée n'est persistée en base : tout vit en mémoire et dans
 * le localStorage, et se réinitialise à la demande.
 */
export {
  isDemoMode,
  enableDemo,
  switchDemoRole,
  resetDemoData,
  exitDemo,
  demoUserForRole,
  homeForRole,
  DEMO_ROLES,
  type DemoRole,
} from './state'
export { installDemoAdapter } from './adapter'
