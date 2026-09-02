import { describe, expect, it } from "vitest";
import { construireIcs } from "./ics";

const base = {
  uid: "abc-123",
  sequence: 0,
  jour: "2026-09-03",
  heureDebut: "10:00",
  heureFin: "11:00",
  titre: "Head spa signature — Stigey",
  lieu: "12 rue des Capucins, 69001 Lyon",
  praticienneNom: "Sonia Bah",
  praticienneEmail: "praticienne@stigey.fr",
  clienteNom: "Awa Diallo",
  clienteEmail: "awa@exemple.fr",
  maintenant: new Date("2026-09-01T08:00:00Z"),
} as const;

describe("construireIcs", () => {
  it("produit une invitation REQUEST, jamais une pièce jointe", () => {
    const ics = construireIcs({ ...base, methode: "REQUEST" });
    expect(ics).toContain("METHOD:REQUEST");
    expect(ics).not.toMatch(/content-disposition/i);
  });

  it("porte l'UID stable et le SEQUENCE fourni", () => {
    const ics = construireIcs({ ...base, methode: "REQUEST", sequence: 3 });
    expect(ics).toContain("UID:abc-123");
    expect(ics).toContain("SEQUENCE:3");
  });

  it("exprime l'heure du rendez-vous en TZID=Europe/Paris, sans conversion UTC", () => {
    const ics = construireIcs({ ...base, methode: "REQUEST" });
    expect(ics).toContain("DTSTART;TZID=Europe/Paris:20260903T100000");
    expect(ics).toContain("DTEND;TZID=Europe/Paris:20260903T110000");
  });

  it("le CANCEL marque l'évènement CANCELLED et garde le même UID", () => {
    const ics = construireIcs({ ...base, methode: "CANCEL", sequence: 1 });
    expect(ics).toContain("METHOD:CANCEL");
    expect(ics).toContain("STATUS:CANCELLED");
    expect(ics).toContain("UID:abc-123");
  });

  it("inclut ORGANIZER (praticienne) et ATTENDEE (cliente)", () => {
    const ics = construireIcs({ ...base, methode: "REQUEST" });
    expect(ics).toContain("mailto:praticienne@stigey.fr");
    expect(ics).toContain("mailto:awa@exemple.fr");
  });

  it("échappe les virgules dans les champs texte", () => {
    const ics = construireIcs({ ...base, methode: "REQUEST", lieu: "12 rue X, 69001 Lyon" });
    expect(ics).toContain("LOCATION:12 rue X\\, 69001 Lyon");
  });
});
