import { construireIcs } from "@/lib/ics";
import { jourCourtLabel } from "@/lib/calendrier";
import { heureLabel } from "@/lib/format";
import { getResendClient, adresseExpedition, praticienneEmail, praticienneNom } from "./resend";

const LIEU = "12 rue des Capucins, 69001 Lyon";

// Charte graphique (voir src/app/globals.css) — dupliquée ici car les emails
// ne peuvent pas consommer les tokens Tailwind du site.
const COFFEE = "#200a09";
const IVORY = "#fff6e3";
const BROWNRED = "#99262b";
const COTTONROSE = "#f1bfc1";
const CLAY = "#6b564b";
const HAIRLINE = "#f1e4c9";

export type ReservationPourEmail = {
  id: string;
  jour: string;
  heureDebut: string;
  heureFin: string;
  nom: string;
  email: string;
  telephone?: string | null;
  icsSequence: number;
  prestationNom: string;
};

function uidPour(id: string): string {
  return `reservation-${id}@stigey.fr`;
}

function creneauLabel(jour: string, heure: string): string {
  return `${jourCourtLabel(jour)} · ${heureLabel(heure)}`;
}

// Habillage commun repris de l'identité du site (bandeau coffee + "Stigey"
// en italique, corps ivoire, accent brownred) : les emails Resend ne
// peuvent pas charger Tailwind/les polices Google, donc tout est dupliqué
// en styles inline avec des fontes de repli proches (Georgia ~ Bodoni Moda,
// Helvetica ~ Lato).
function emailShell(bodyHtml: string): string {
  return `
    <div style="background:${IVORY};padding:32px 16px;font-family:Helvetica,Arial,sans-serif;">
      <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid ${HAIRLINE};">
        <div style="background:${COFFEE};padding:26px 32px;text-align:center;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:22px;letter-spacing:0.04em;color:${IVORY};">Stigey</div>
          <div style="margin-top:6px;font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:${COTTONROSE};">Head spa &middot; Lyon</div>
        </div>
        <div style="padding:32px;color:${COFFEE};font-size:15px;line-height:1.65;">
          ${bodyHtml}
        </div>
        <div style="padding:16px 32px 24px;font-size:11px;color:${CLAY};text-align:center;border-top:1px solid ${HAIRLINE};">
          Stigey &mdash; ${LIEU}
        </div>
      </div>
    </div>
  `;
}

function creneauBox(label: string, sousTexte?: string): string {
  return `
    <div style="margin:18px 0;padding:16px 18px;border-radius:14px;background:${IVORY};border:1px solid ${HAIRLINE};">
      <div style="font-weight:700;color:${BROWNRED};font-size:16px;">${label}</div>
      ${sousTexte ? `<div style="margin-top:2px;color:${CLAY};font-size:13px;">${sousTexte}</div>` : ""}
    </div>
  `;
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
    html: emailShell(`
      <p>Bonjour ${r.nom.split(" ")[0]},</p>
      <p>Votre rendez-vous <strong>${r.prestationNom}</strong> est confirmé :</p>
      ${creneauBox(creneauLabel(r.jour, r.heureDebut), LIEU)}
      <p>Vous trouverez une invitation calendrier en pièce jointe. Annulation libre jusqu'à 24 h avant.</p>
      <p>À très vite,<br>${praticienneNom()}</p>
    `),
    ics: { contenu: ics, methode: "REQUEST" },
  });
}

// Notification à la praticienne elle-même : jusqu'ici seule la cliente
// recevait un email (l'adresse praticienne n'était utilisée que comme
// ORGANIZER dans l'.ics, jamais comme destinataire réel) — elle n'était donc
// jamais prévenue d'une nouvelle réservation.
export async function envoyerNotificationPraticienne(r: ReservationPourEmail) {
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
    to: praticienneEmail(),
    subject: `Nouvelle réservation — ${creneauLabel(r.jour, r.heureDebut)}`,
    html: emailShell(`
      <p>Bonjour ${praticienneNom().split(" ")[0]},</p>
      <p>Une nouvelle réservation vient d'arriver :</p>
      ${creneauBox(creneauLabel(r.jour, r.heureDebut), r.prestationNom)}
      <p style="margin:0;">${r.nom}<br>${r.email}${r.telephone ? `<br>${r.telephone}` : ""}</p>
      <p>Invitation calendrier en pièce jointe.</p>
    `),
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
    html: emailShell(`
      <p>Bonjour ${r.nom.split(" ")[0]},</p>
      <p>Votre rendez-vous <strong>${r.prestationNom}</strong> a été reporté :</p>
      <p style="margin:0;color:${CLAY};text-decoration:line-through;">${creneauLabel(ancienJour, ancienHeure)}</p>
      ${creneauBox(creneauLabel(r.jour, r.heureDebut), LIEU)}
      <p>Votre agenda se met à jour automatiquement avec la pièce jointe ci-dessous.</p>
      <p>À très vite,<br>${praticienneNom()}</p>
    `),
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
    html: emailShell(`
      <p>Bonjour ${r.nom.split(" ")[0]},</p>
      <p>Votre rendez-vous <strong>${r.prestationNom}</strong> du ${creneauLabel(r.jour, r.heureDebut)} a été annulé. Le créneau est libéré.</p>
      <p>Envie de reprendre rendez-vous ? Le site reste ouvert 24 h / 24.</p>
      <p>${praticienneNom()}</p>
    `),
    ics: { contenu: ics, methode: "CANCEL" },
  });
}

// Rappel anti-no-show (ADR-0002) : ~48 h avant, sans nouvelle pièce jointe
// (l'évènement est déjà dans l'agenda depuis la confirmation).
export async function envoyerRappel(r: ReservationPourEmail) {
  await envoyer({
    to: r.email,
    subject: `Demain ou après-demain : ${r.prestationNom} chez Stigey`,
    html: emailShell(`
      <p>Bonjour ${r.nom.split(" ")[0]},</p>
      <p>Petit rappel : votre rendez-vous <strong>${r.prestationNom}</strong> approche.</p>
      ${creneauBox(creneauLabel(r.jour, r.heureDebut), LIEU)}
      <p>Un empêchement ? Vous pouvez encore annuler ou reporter gratuitement jusqu'à 24 h avant le
      rendez-vous — écrivez-moi ou appelez au 06 12 34 56 78.</p>
      <p>À très vite,<br>${praticienneNom()}</p>
    `),
  });
}
