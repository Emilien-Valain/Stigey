// Logique pure du catalogue (Catégories → Prestations) : sans I/O, partagée
// entre le site public et l'espace praticienne. Voir CONTEXT.md : Catégorie.

export type Groupe<C extends { id: string }, P extends { categorieId: string }> = {
  categorie: C;
  prestations: P[];
};

// L'ordre des entrées est celui de la praticienne (déjà trié côté données) :
// on le conserve tel quel, on ne retrie jamais ici.
export function grouperParCategorie<C extends { id: string }, P extends { categorieId: string }>(
  categories: C[],
  prestations: P[],
  options: { masquerVides?: boolean } = {},
): Groupe<C, P>[] {
  const groupes = categories.map((categorie) => ({
    categorie,
    prestations: prestations.filter((p) => p.categorieId === categorie.id),
  }));
  return options.masquerVides ? groupes.filter((g) => g.prestations.length > 0) : groupes;
}

// Déplace `id` d'un cran dans `ordre` (nouvelle liste, l'entrée n'est pas
// modifiée). Aux extrémités ou pour un id inconnu, l'ordre est inchangé.
export function deplacer(ordre: string[], id: string, sens: "haut" | "bas"): string[] {
  const index = ordre.indexOf(id);
  const cible = sens === "haut" ? index - 1 : index + 1;
  if (index === -1 || cible < 0 || cible >= ordre.length) return [...ordre];
  const suite = [...ordre];
  [suite[index], suite[cible]] = [suite[cible], suite[index]];
  return suite;
}

// ---------------------------------------------------------------- Variantes
// Voir CONTEXT.md : Variante. Une Prestation est soit simple (durée et prix
// propres), soit à variantes (≥ 2 Variantes actives, durée et prix propres nuls) ;
// la cliente choisit alors exactement une Variante.

export type Tarif = { dureeMinutes: number; prixCentimes: number };

type PrestationTarifee = {
  dureeMinutes: number | null;
  prixCentimes: number | null;
  variantes: (Tarif & { id: string })[];
};

// Durée et prix effectivement réservés : ceux de la Variante choisie, ou ceux
// de la Prestation si elle est simple. `undefined` si la sélection est
// incohérente (variante manquante, inconnue, ou donnée à une Prestation simple).
export function tarifDe(prestation: PrestationTarifee, varianteId?: string | null): Tarif | undefined {
  if (prestation.variantes.length > 0) {
    return prestation.variantes.find((v) => v.id === varianteId);
  }
  if (varianteId || prestation.dureeMinutes === null || prestation.prixCentimes === null) {
    return undefined;
  }
  return { dureeMinutes: prestation.dureeMinutes, prixCentimes: prestation.prixCentimes };
}

export type ResumeTarifs = { duree: string; prix: string };

// Libellés d'une carte de Prestation, toujours au format « durée · prix » :
// simple -> « 1 h » / « 60 € » ; à variantes -> « 1 h – 1 h 30 » / « à partir de 40 € ».
export function resumeTarifs(
  prestation: PrestationTarifee,
  formaterDuree: (minutes: number) => string,
  formaterPrix: (centimes: number) => string,
): ResumeTarifs {
  const tarifs: Tarif[] =
    prestation.variantes.length > 0
      ? prestation.variantes
      : prestation.dureeMinutes !== null && prestation.prixCentimes !== null
        ? [{ dureeMinutes: prestation.dureeMinutes, prixCentimes: prestation.prixCentimes }]
        : [];
  if (tarifs.length === 0) return { duree: "", prix: "" };

  const durees = tarifs.map((t) => t.dureeMinutes);
  const prix = tarifs.map((t) => t.prixCentimes);
  const dureeMin = Math.min(...durees);
  const dureeMax = Math.max(...durees);
  const prixMin = Math.min(...prix);
  const prixMax = Math.max(...prix);

  return {
    duree:
      dureeMin === dureeMax
        ? formaterDuree(dureeMin)
        : `${formaterDuree(dureeMin)} – ${formaterDuree(dureeMax)}`,
    prix: prixMin === prixMax ? formaterPrix(prixMin) : `à partir de ${formaterPrix(prixMin)}`,
  };
}
