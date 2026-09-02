// Calcul de Créneau — ADR-0006 : Disponibilité récurrente − Indisponibilités
// − Réservations existantes, en ne gardant que les débuts où la durée de la
// prestation (battement inclus) tient. Fonction pure, sans I/O : les données
// du jour (dispo, indispos, réservations) sont assemblées par l'appelant
// (src/lib/data/creneaux.ts côté serveur) puis passées ici.

export type Slot = { heure: string; libre: boolean };

export type Plage = { heureDebut: string; heureFin: string };

export type DispoJour = { ouvert: boolean; heureDebut: string; heureFin: string };

export type Indisponibilite = { heureDebut: string | null; heureFin: string | null };

function minutes(heure: string): number {
  const [h, m] = heure.split(":").map(Number);
  return h * 60 + m;
}

function toHeure(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function chevauche(aDebut: number, aFin: number, bDebut: number, bFin: number): boolean {
  return aDebut < bFin && aFin > bDebut;
}

export function calculerCreneaux(params: {
  dureeMinutes: number;
  battementMinutes: number;
  dispoJour: DispoJour;
  indisponibilites: Indisponibilite[];
  reservationsExistantes: Plage[];
  pasMinutes?: number;
}): Slot[] {
  const {
    dureeMinutes,
    battementMinutes,
    dispoJour,
    indisponibilites,
    reservationsExistantes,
    pasMinutes = 30,
  } = params;

  if (!dispoJour.ouvert) return [];

  const journeeEntiereBloquee = indisponibilites.some(
    (i) => i.heureDebut === null || i.heureFin === null,
  );
  if (journeeEntiereBloquee) return [];

  const occupees: Array<[number, number]> = [
    ...indisponibilites.map(
      (i) => [minutes(i.heureDebut as string), minutes(i.heureFin as string)] as [number, number],
    ),
    ...reservationsExistantes.map(
      (r) => [minutes(r.heureDebut), minutes(r.heureFin) + battementMinutes] as [number, number],
    ),
  ];

  const ouvertureDebut = minutes(dispoJour.heureDebut);
  const ouvertureFin = minutes(dispoJour.heureFin);

  const slots: Slot[] = [];
  for (
    let debut = ouvertureDebut;
    debut + dureeMinutes <= ouvertureFin;
    debut += pasMinutes
  ) {
    const fin = debut + dureeMinutes;
    const libre = !occupees.some(([oDebut, oFin]) => chevauche(debut, fin, oDebut, oFin));
    slots.push({ heure: toHeure(debut), libre });
  }
  return slots;
}
