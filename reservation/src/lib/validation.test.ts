import { describe, expect, it } from "vitest";
import { emailValide, validerCategorie, validerOrdre, validerPrestation } from "./validation";

describe("emailValide", () => {
  it("accepte un email correctement formé", () => {
    expect(emailValide("awa@exemple.fr")).toBe(true);
    expect(emailValide("  awa@exemple.fr  ")).toBe(true);
  });

  it("rejette les formats invalides", () => {
    expect(emailValide("")).toBe(false);
    expect(emailValide("awa")).toBe(false);
    expect(emailValide("awa@")).toBe(false);
    expect(emailValide("awa@exemple")).toBe(false);
    expect(emailValide("@exemple.fr")).toBe(false);
    expect(emailValide("awa exemple@fr.fr")).toBe(false);
  });
});

const ID_A = "3f2b1c4e-8a6d-4b7e-9c10-2d5e6f7a8b9c";
const ID_B = "7a1d9e2c-5b3f-4c8a-8e64-1f0a9b8c7d6e";

describe("validerOrdre", () => {
  it("accepte une liste d'identifiants uuid distincts", () => {
    expect(validerOrdre([ID_A, ID_B])).toEqual({ ok: true, valeur: [ID_A, ID_B] });
  });

  it("rejette tout ce qui n'est pas une liste de uuid", () => {
    expect(validerOrdre("nope").ok).toBe(false);
    expect(validerOrdre([]).ok).toBe(false);
    expect(validerOrdre([ID_A, "1; drop table prestations"]).ok).toBe(false);
    expect(validerOrdre([ID_A, 42]).ok).toBe(false);
  });

  it("rejette les doublons", () => {
    expect(validerOrdre([ID_A, ID_A]).ok).toBe(false);
  });

  it("rejette une liste démesurée", () => {
    const enorme = Array.from({ length: 101 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`);
    expect(validerOrdre(enorme).ok).toBe(false);
  });
});

describe("validerCategorie", () => {
  it("accepte un nom et le nettoie des espaces autour", () => {
    expect(validerCategorie({ nom: "  Massages  " })).toEqual({ ok: true, valeur: { nom: "Massages" } });
  });

  it("rejette un nom vide ou blanc", () => {
    expect(validerCategorie({ nom: "   " }).ok).toBe(false);
    expect(validerCategorie({ nom: "" }).ok).toBe(false);
  });

  it("rejette un nom trop long ou d'un mauvais type", () => {
    expect(validerCategorie({ nom: "x".repeat(81) }).ok).toBe(false);
    expect(validerCategorie({ nom: 12 }).ok).toBe(false);
    expect(validerCategorie(null).ok).toBe(false);
  });
});

describe("validerPrestation", () => {
  const valide = {
    nom: "  Head spa signature ",
    categorieId: ID_A,
    dureeMinutes: 75,
    prixCentimes: 7500,
    accroche: "L'expérience complète.",
    description: "Le rituel complet.",
    cible: "envie de relâcher.",
    miseEnAvant: true,
  };

  it("accepte une prestation complète et nettoie le nom", () => {
    expect(validerPrestation(valide)).toEqual({
      ok: true,
      valeur: { ...valide, nom: "Head spa signature", image: "", variantes: [] },
    });
  });

  it("accepte une image sous /images/ et l'absence d'image", () => {
    const avec = validerPrestation({ ...valide, image: "/images/head-spa-bac.jpg" });
    expect(avec.ok && avec.valeur.image).toBe("/images/head-spa-bac.jpg");
    expect(validerPrestation({ ...valide, image: "" }).ok).toBe(true);
  });

  it("rejette une image hors /images/, remontante, distante ou non image", () => {
    for (const image of [
      "https://exemple.fr/a.jpg",
      "/images/../secret.jpg",
      "/images/sous/dossier.jpg",
      "/autre/a.jpg",
      "/images/script.js",
      42,
    ]) {
      expect(validerPrestation({ ...valide, image }).ok).toBe(false);
    }
  });

  describe("variantes", () => {
    const tresses = { nom: " Tresses ", dureeMinutes: 90, prixCentimes: 6000 };
    const chignon = { id: ID_B, nom: "Chignon", dureeMinutes: 60, prixCentimes: 4000 };

    it("accepte ≥ 2 variantes et met à null la durée et le prix de la prestation", () => {
      const resultat = validerPrestation({ ...valide, variantes: [tresses, chignon] });
      expect(resultat).toMatchObject({
        ok: true,
        valeur: {
          dureeMinutes: null,
          prixCentimes: null,
          variantes: [{ ...tresses, nom: "Tresses" }, chignon],
        },
      });
    });

    it("n'exige pas de durée ni de prix propres avec des variantes", () => {
      const sansTarif: Record<string, unknown> = { ...valide };
      delete sansTarif.dureeMinutes;
      delete sansTarif.prixCentimes;
      expect(validerPrestation({ ...sansTarif, variantes: [tresses, chignon] }).ok).toBe(true);
      expect(validerPrestation(sansTarif).ok).toBe(false);
    });

    it("rejette une variante seule", () => {
      expect(validerPrestation({ ...valide, variantes: [tresses] }).ok).toBe(false);
    });

    it("rejette nom vide, durée ou prix invalides, id douteux ou en double", () => {
      for (const mauvaise of [
        { ...tresses, nom: "  " },
        { ...tresses, dureeMinutes: 0 },
        { ...tresses, prixCentimes: -1 },
        { ...tresses, prixCentimes: 12.5 },
        { ...tresses, id: "pas-un-uuid" },
      ]) {
        expect(validerPrestation({ ...valide, variantes: [mauvaise, chignon] }).ok).toBe(false);
      }
      expect(validerPrestation({ ...valide, variantes: [chignon, chignon] }).ok).toBe(false);
      expect(validerPrestation({ ...valide, variantes: "oui" }).ok).toBe(false);
    });
  });

  it("accepte un id existant (modification)", () => {
    const resultat = validerPrestation({ ...valide, id: ID_B });
    expect(resultat.ok && resultat.valeur.id).toBe(ID_B);
  });

  it("rejette un nom vide", () => {
    expect(validerPrestation({ ...valide, nom: " " }).ok).toBe(false);
  });

  it("rejette une durée non entière, nulle, négative ou démesurée", () => {
    for (const dureeMinutes of [0, -15, 7.5, 601, "60"]) {
      expect(validerPrestation({ ...valide, dureeMinutes }).ok).toBe(false);
    }
  });

  it("rejette un prix négatif, non entier ou démesuré, mais accepte 0", () => {
    for (const prixCentimes of [-1, 10.5, 1_000_001, "40"]) {
      expect(validerPrestation({ ...valide, prixCentimes }).ok).toBe(false);
    }
    expect(validerPrestation({ ...valide, prixCentimes: 0 }).ok).toBe(true);
  });

  it("rejette une catégorie ou un id qui ne sont pas des uuid", () => {
    expect(validerPrestation({ ...valide, categorieId: "abc" }).ok).toBe(false);
    expect(validerPrestation({ ...valide, id: "abc" }).ok).toBe(false);
  });

  it("rejette une mise en avant qui n'est pas un booléen", () => {
    expect(validerPrestation({ ...valide, miseEnAvant: "oui" }).ok).toBe(false);
  });

  it("rejette des textes trop longs", () => {
    expect(validerPrestation({ ...valide, description: "x".repeat(2001) }).ok).toBe(false);
    expect(validerPrestation({ ...valide, accroche: "x".repeat(301) }).ok).toBe(false);
    expect(validerPrestation({ ...valide, cible: "x".repeat(501) }).ok).toBe(false);
  });
});
