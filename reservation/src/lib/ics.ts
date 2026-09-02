// Invitation calendrier .ics — ADR-0004 : method=REQUEST/CANCEL avec
// ORGANIZER/ATTENDEE, UID stable et SEQUENCE incrémenté, JAMAIS une pièce
// jointe inerte (voir .semgrep/custom-rules.yml:ics-invitation-not-attachment).
// C'est cette distinction qui fait que l'évènement s'ajoute/se déplace/se
// supprime tout seul dans l'agenda de la praticienne ET de la cliente.
//
// DTSTART/DTEND sont exprimés en TZID=Europe/Paris avec l'heure murale telle
// que saisie (jour + heure_debut/fin, déjà en heure locale — voir schéma
// reservations) : pas de conversion UTC, donc pas de bug de DST. Seul DTSTAMP
// (horodatage d'envoi, pas horaire du rendez-vous) doit être en UTC par
// spec RFC 5545.

const VTIMEZONE_EUROPE_PARIS = `BEGIN:VTIMEZONE
TZID:Europe/Paris
BEGIN:DAYLIGHT
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
TZNAME:CEST
DTSTART:19700329T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
TZNAME:CET
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE`;

function echapper(texte: string): string {
  return texte.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

// "2026-09-03" + "10:00:00" -> "20260903T100000"
function versDateHeureLocale(jour: string, heure: string): string {
  return `${jour.replace(/-/g, "")}T${heure.replace(/:/g, "").padEnd(6, "0")}`;
}

function versDateHeureUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export type IcsEvenement = {
  uid: string;
  sequence: number;
  methode: "REQUEST" | "CANCEL";
  jour: string; // YYYY-MM-DD
  heureDebut: string; // HH:MM ou HH:MM:SS
  heureFin: string;
  titre: string;
  lieu: string;
  praticienneNom: string;
  praticienneEmail: string;
  clienteNom: string;
  clienteEmail: string;
  maintenant?: Date;
};

export function construireIcs(e: IcsEvenement): string {
  const dtstamp = versDateHeureUtc(e.maintenant ?? new Date());
  const statutEvenement = e.methode === "CANCEL" ? "CANCELLED" : "CONFIRMED";

  const lignes = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Stigey//Reservation//FR",
    "CALSCALE:GREGORIAN",
    `METHOD:${e.methode}`,
    VTIMEZONE_EUROPE_PARIS,
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `SEQUENCE:${e.sequence}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;TZID=Europe/Paris:${versDateHeureLocale(e.jour, e.heureDebut)}`,
    `DTEND;TZID=Europe/Paris:${versDateHeureLocale(e.jour, e.heureFin)}`,
    `SUMMARY:${echapper(e.titre)}`,
    `LOCATION:${echapper(e.lieu)}`,
    `STATUS:${statutEvenement}`,
    `ORGANIZER;CN=${echapper(e.praticienneNom)}:mailto:${e.praticienneEmail}`,
    `ATTENDEE;CN=${echapper(e.clienteNom)};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${e.clienteEmail}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lignes.join("\r\n");
}
