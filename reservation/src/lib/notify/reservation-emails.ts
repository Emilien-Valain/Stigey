import { construireIcs } from "@/lib/ics";
import { jourCourtLabel } from "@/lib/calendrier";
import { heureLabel } from "@/lib/format";
import { getResendClient, adresseExpedition, praticienneEmail, praticienneNom } from "./resend";

const LIEU = "12 rue des Capucins, 69001 Lyon";

export type ReservationPourEmail = {
  id: string;
  jour: string;
  heureDebut: string;
  heureFin: string;
  nom: string;
  email: string;
  icsSequence: number;
  prestationNom: string;
};

function uidPour(id: string): string {
  return `reservation-${id}@stigey.fr`;
}

function creneauLabel(jour: string, heure: string): string {
  return `${jourCourtLabel(jour)} · ${heureLabel(heure)}`;
}

// Best-effort partout : une Réservation reste valide en base même si
// l'email/l'invitation échoue à partir (clé Resend absente, domaine non
// vérifié, panne réseau...). Jamais remonté comme une erreur de réservation.
async function envoyer(params: {
  to: string;
  subject: string;
  html: string;
  ics?: { contenu: string; methode: "REQUEST" | "CANCEL" };
}) {
  const client = getResendClient();
  if (!client) {
    console.info(`[email] Resend non configuré (RESEND_API_KEY absente) — email "${params.subject}" à ${params.to} non envoyé.`);
    return;
  }

  try {
    await client.emails.send({
      from: adresseExpedition(),
      to: params.to,
      subject: params.subject,
      html: params.html,
      attachments: params.ics
        ? [
            {
              filename: "invitation.ics",
              content: Buffer.from(params.ics.contenu, "utf-8"),
              // text/calendar + method (pas de charset/name en plus dans la
              // même valeur : ça déclenche une erreur "duplicate header"
              // côté Resend). C'est ce qui fait qu'un client mail détecte
              // une invitation calendrier, pas un fichier générique.
              contentType: `text/calendar; method=${params.ics.methode}`,
            },
          ]
        : undefined,
    });
  } catch (err) {
    console.error(`[email] échec d'envoi ("${params.subject}" à ${params.to}) :`, err);
  }
}

export async function envoyerConfirmation(r: ReservationPourEmail) {
  const ics = construireIcs({
    uid: uidPour(r.id),
    sequence: r.icsSequence,
    methode: "REQUEST",
    jour: r.jour,
    heureDebut: r.heureDebut,
    heureFin: r.heureFin,
    titre: `${r.prestationNom} — Stigey`,
    lieu: LIEU,
    praticienneNom: praticienneNom(),
    praticienneEmail: praticienneEmail(),
    clienteNom: r.nom,
    clienteEmail: r.email,
  });

  await envoyer({
    to: r.email,
    subject: `C'est confirmé — ${creneauLabel(r.jour, r.heureDebut)}`,
    html: `
      <p>Bonjour ${r.nom.split(" ")[0]},</p>
      <p>Votre rendez-vous <strong>${r.prestationNom}</strong> est confirmé :</p>
      <p><strong>${creneauLabel(r.jour, r.heureDebut)}</strong><br>${LIEU}</p>
      <p>Vous trouverez une invitation calendrier en pièce jointe. Annulation libre jusqu'à 24 h avant.</p>
      <p>À très vite,<br>${praticienneNom()}</p>
    `,
    ics: { contenu: ics, methode: "REQUEST" },
  });
}

export async function envoyerReport(r: ReservationPourEmail, ancienJour: string, ancienHeure: string) {
  const ics = construireIcs({
    uid: uidPour(r.id),
    sequence: r.icsSequence,
    methode: "REQUEST",
    jour: r.jour,
    heureDebut: r.heureDebut,
    heureFin: r.heureFin,
    titre: `${r.prestationNom} — Stigey`,
    lieu: LIEU,
    praticienneNom: praticienneNom(),
    praticienneEmail: praticienneEmail(),
    clienteNom: r.nom,
    clienteEmail: r.email,
  });

  await envoyer({
    to: r.email,
    subject: `Votre rendez-vous a été reporté — ${creneauLabel(r.jour, r.heureDebut)}`,
    html: `
      <p>Bonjour ${r.nom.split(" ")[0]},</p>
      <p>Votre rendez-vous <strong>${r.prestationNom}</strong> a été reporté :</p>
      <p>Ancien créneau : ${creneauLabel(ancienJour, ancienHeure)} (annulé)<br>
      Nouveau créneau : <strong>${creneauLabel(r.jour, r.heureDebut)}</strong><br>${LIEU}</p>
      <p>Votre agenda se met à jour automatiquement avec la pièce jointe ci-dessous.</p>
      <p>À très vite,<br>${praticienneNom()}</p>
    `,
    ics: { contenu: ics, methode: "REQUEST" },
  });
}

export async function envoyerAnnulation(r: ReservationPourEmail) {
  const ics = construireIcs({
    uid: uidPour(r.id),
    sequence: r.icsSequence,
    methode: "CANCEL",
    jour: r.jour,
    heureDebut: r.heureDebut,
    heureFin: r.heureFin,
    titre: `${r.prestationNom} — Stigey`,
    lieu: LIEU,
    praticienneNom: praticienneNom(),
    praticienneEmail: praticienneEmail(),
    clienteNom: r.nom,
    clienteEmail: r.email,
  });

  await envoyer({
    to: r.email,
    subject: `Votre rendez-vous du ${creneauLabel(r.jour, r.heureDebut)} est annulé`,
    html: `
      <p>Bonjour ${r.nom.split(" ")[0]},</p>
      <p>Votre rendez-vous <strong>${r.prestationNom}</strong> du ${creneauLabel(r.jour, r.heureDebut)} a été annulé. Le créneau est libéré.</p>
      <p>Envie de reprendre rendez-vous ? Le site reste ouvert 24 h / 24.</p>
      <p>${praticienneNom()}</p>
    `,
    ics: { contenu: ics, methode: "CANCEL" },
  });
}

// Rappel anti-no-show (ADR-0002) : ~48 h avant, sans nouvelle pièce jointe
// (l'évènement est déjà dans l'agenda depuis la confirmation).
export async function envoyerRappel(r: ReservationPourEmail) {
  await envoyer({
    to: r.email,
    subject: `Demain ou après-demain : ${r.prestationNom} chez Stigey`,
    html: `
      <p>Bonjour ${r.nom.split(" ")[0]},</p>
      <p>Petit rappel : votre rendez-vous <strong>${r.prestationNom}</strong> approche.</p>
      <p><strong>${creneauLabel(r.jour, r.heureDebut)}</strong><br>${LIEU}</p>
      <p>Un empêchement ? Vous pouvez encore annuler ou reporter gratuitement jusqu'à 24 h avant le
      rendez-vous — écrivez-moi ou appelez au 06 12 34 56 78.</p>
      <p>À très vite,<br>${praticienneNom()}</p>
    `,
  });
}
