// Sous vraie concurrence (deux clients qui écrivent en même temps sur le
// créneau), Postgres peut renvoyer un deadlock (40P01) au lieu d'une
// violation propre de la contrainte d'exclusion (23P01) — les deux
// transactions se verrouillent l'une l'autre pendant la vérification de
// l'index GiST, indépendamment du fait que les créneaux se chevauchent
// réellement. Un deadlock est transitoire : la retenter une fois suffit.
export function estDeadlock(error: { code?: string } | null | undefined): boolean {
  return error?.code === "40P01";
}

// Messages lisibles pour la praticienne. Les erreurs métier sont levées par
// les triggers/fonctions de 0004_categories_prestations.sql et
// 0005_variantes_prestations.sql ; toute autre
// erreur reste générique : le détail SQL ne sort jamais vers le client.
export function messageCatalogue(error: { message?: string }): string {
  const message = error.message ?? "";
  if (message.includes("categorie_non_vide")) {
    return "Cette catégorie contient encore des soins : déplacez-les ou supprimez-les d'abord.";
  }
  if (message.includes("ordre_incomplet")) {
    return "Le catalogue a changé entre-temps : rechargez la page puis réessayez.";
  }
  if (message.includes("categorie_inactive")) {
    return "Cette catégorie n'existe plus : choisissez-en une autre.";
  }
  if (message.includes("variantes_insuffisantes")) {
    return "Ajoutez au moins deux variantes, ou aucune.";
  }
  if (message.includes("duree_prix_requis")) {
    return "La durée et le prix sont nécessaires.";
  }
  if (message.includes("prestation_introuvable") || message.includes("variante_introuvable")) {
    return "Cette prestation a changé entre-temps : rechargez la page puis réessayez.";
  }
  return "Une erreur est survenue. Réessayez dans un instant.";
}
