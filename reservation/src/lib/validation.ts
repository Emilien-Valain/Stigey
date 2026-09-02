// Validation partagée entre le tunnel public et les Server Actions
// (défense en profondeur : revalidé côté serveur, jamais fait confiance au
// seul contrôle client). Regex volontairement simple — suffisant pour
// rejeter les fautes de frappe évidentes, pas une RFC 5322 complète.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailValide(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}
