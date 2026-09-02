import { Resend } from "resend";

// Pas de clé configurée (dev local avant branchement, voir .env.local.example)
// -> les fonctions d'envoi deviennent des no-op silencieux plutôt que de
// faire échouer la réservation, qui reste valide en base indépendamment de
// l'email. Un échec Resend (réseau, domaine non vérifié...) suit la même
// logique : loggé, jamais remonté comme une erreur de réservation.
export function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

export function adresseExpedition(): string {
  return process.env.RESEND_FROM_EMAIL ?? "Stigey <onboarding@resend.dev>";
}

export function praticienneEmail(): string {
  return process.env.PRATICIENNE_EMAIL ?? "praticienne@stigey.fr";
}

export function praticienneNom(): string {
  return process.env.PRATICIENNE_NOM ?? "Sonia Bah";
}
