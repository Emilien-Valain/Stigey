// Modèle de démonstration en mémoire pour le tunnel de réservation.
// Pas de backend branché : aucune donnée n'est envoyée ni persistée.
// Le vrai calcul de Créneau (Disponibilité récurrente − Indisponibilités −
// Réservations, battement inclus — voir reservation/docs/adr/0006) vivra
// côté serveur une fois Supabase branché. Voir méthode SyncPotes §1.4.

export type Jour = {
  date: Date;
  dow: string;
  num: string;
  mois: string;
};

export type Slot = {
  heure: string;
  libre: boolean;
};

const JOURS_COURTS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MOIS_COURTS = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

// Horaires d'ouverture (voir page Contact) : mardi-vendredi et samedi.
export function joursOuverts(count = 8): Jour[] {
  const out: Jour[] = [];
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (out.length < count) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 1) {
      out.push({
        date: new Date(d.getTime()),
        dow: JOURS_COURTS[dow],
        num: String(d.getDate()),
        mois: MOIS_COURTS[d.getMonth()],
      });
    }
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function jourLabel(date: Date): string {
  const jourComplet = [
    "dimanche",
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
  ][date.getDay()];
  const moisComplet = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ][date.getMonth()];
  return `${jourComplet.charAt(0).toUpperCase()}${jourComplet.slice(1)} ${date.getDate()} ${moisComplet}`;
}

export function slotsPour(date: Date): Slot[] {
  const heures =
    date.getDay() === 6
      ? ["9:00", "10:30", "12:00", "14:00", "15:30"]
      : ["10:00", "11:30", "14:00", "15:30", "17:00", "18:00"];
  return heures.map((heure, i) => ({
    heure,
    libre: (date.getDate() + i) % 5 !== 2,
  }));
}
