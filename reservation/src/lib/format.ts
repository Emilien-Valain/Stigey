// Libellés partagés entre le site public et l'espace praticienne — une seule
// source pour "1 h 15" / "75 €" (voir reservation/CONTEXT.md : Prestation).

export function dureeLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const r = minutes % 60;
  if (!h) return `${minutes} min`;
  return r ? `${h} h ${r}` : `${h} h`;
}

export function prixLabel(centimes: number): string {
  return `${Math.round(centimes / 100)} €`;
}

export function heureLabel(heure: string): string {
  // "09:00:00" (Postgres time) -> "9:00" (déjà utilisé côté site public).
  const [h, m] = heure.split(":");
  return `${Number(h)}:${m}`;
}
