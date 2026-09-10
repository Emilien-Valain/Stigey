// Sous vraie concurrence (deux clients qui écrivent en même temps sur le
// créneau), Postgres peut renvoyer un deadlock (40P01) au lieu d'une
// violation propre de la contrainte d'exclusion (23P01) — les deux
// transactions se verrouillent l'une l'autre pendant la vérification de
// l'index GiST, indépendamment du fait que les créneaux se chevauchent
// réellement. Un deadlock est transitoire : la retenter une fois suffit.
export function estDeadlock(error: { code?: string } | null | undefined): boolean {
  return error?.code === "40P01";
}
