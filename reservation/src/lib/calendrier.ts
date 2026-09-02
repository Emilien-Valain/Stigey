// Génération de la bande de jours du tunnel de réservation (étape 2) et
// formatage de date en français. Pure UI/calendrier — la disponibilité réelle
// (Disponibilité récurrente, Indisponibilités, Réservations) vit dans
// src/lib/creneaux.ts.

export type Jour = { date: Date; dow: string; num: string; mois: string };

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

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// `joursOuvertsSemaine` : jours de la semaine ouverts (0=dimanche…6=samedi,
// voir disponibilites_recurrentes), issus de la vraie semaine type.
export function genererJours(joursOuvertsSemaine: number[], count = 8): Jour[] {
  const out: Jour[] = [];
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (out.length < count) {
    if (joursOuvertsSemaine.includes(d.getDay())) {
      out.push({
        date: new Date(d.getTime()),
        dow: JOURS_COURTS[d.getDay()],
        num: String(d.getDate()),
        mois: MOIS_COURTS[d.getMonth()],
      });
    }
    d.setDate(d.getDate() + 1);
  }
  return out;
}

// "2026-09-02" -> "Mer 2 sept" (utilisé dans les listes admin, plus compact
// que jourLabel()).
export function jourCourtLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${JOURS_COURTS[date.getDay()]} ${d} ${MOIS_COURTS[m - 1].toLowerCase()}`;
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
