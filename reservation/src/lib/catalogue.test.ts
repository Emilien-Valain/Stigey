import { describe, expect, it } from "vitest";
import { deplacer, grouperParCategorie, resumeTarifs, tarifDe } from "./catalogue";
import { dureeLabel, prixLabel } from "./format";

const soins = { id: "c-soins", nom: "Soins du cuir chevelu" };
const massages = { id: "c-massages", nom: "Massages" };
const vide = { id: "c-vide", nom: "Nouveautés" };

const diagnostic = { id: "p-diag", categorieId: "c-soins" };
const signature = { id: "p-signature", categorieId: "c-soins" };
const relaxant = { id: "p-relaxant", categorieId: "c-massages" };

describe("grouperParCategorie", () => {
  it("regroupe les prestations sous leur catégorie, en respectant l'ordre reçu", () => {
    const groupes = grouperParCategorie([massages, soins], [diagnostic, relaxant, signature]);

    expect(groupes).toEqual([
      { categorie: massages, prestations: [relaxant] },
      { categorie: soins, prestations: [diagnostic, signature] },
    ]);
  });

  it("garde les catégories vides par défaut (l'admin doit pouvoir les remplir)", () => {
    const groupes = grouperParCategorie([soins, vide], [diagnostic]);

    expect(groupes.map((g) => g.categorie.id)).toEqual(["c-soins", "c-vide"]);
  });

  it("peut masquer les catégories vides (site public)", () => {
    const groupes = grouperParCategorie([soins, vide], [diagnostic], { masquerVides: true });

    expect(groupes.map((g) => g.categorie.id)).toEqual(["c-soins"]);
  });
});

describe("deplacer", () => {
  it("monte un élément d'un cran", () => {
    expect(deplacer(["a", "b", "c"], "b", "haut")).toEqual(["b", "a", "c"]);
  });

  it("descend un élément d'un cran", () => {
    expect(deplacer(["a", "b", "c"], "b", "bas")).toEqual(["a", "c", "b"]);
  });

  it("ne bouge pas le premier vers le haut ni le dernier vers le bas", () => {
    expect(deplacer(["a", "b", "c"], "a", "haut")).toEqual(["a", "b", "c"]);
    expect(deplacer(["a", "b", "c"], "c", "bas")).toEqual(["a", "b", "c"]);
  });

  it("ignore un identifiant inconnu", () => {
    expect(deplacer(["a", "b"], "z", "haut")).toEqual(["a", "b"]);
  });

  it("ne modifie pas la liste d'origine", () => {
    const ordre = ["a", "b", "c"];
    deplacer(ordre, "b", "haut");
    expect(ordre).toEqual(["a", "b", "c"]);
  });
});

const simple = { dureeMinutes: 60, prixCentimes: 4000, variantes: [] };
const coiffage = {
  dureeMinutes: null,
  prixCentimes: null,
  variantes: [
    { id: "v-tresses", dureeMinutes: 90, prixCentimes: 6000 },
    { id: "v-chignon", dureeMinutes: 60, prixCentimes: 4000 },
  ],
};

describe("tarifDe", () => {
  it("renvoie la durée et le prix de la prestation simple", () => {
    expect(tarifDe(simple)).toEqual({ dureeMinutes: 60, prixCentimes: 4000 });
  });

  it("renvoie ceux de la variante choisie", () => {
    expect(tarifDe(coiffage, "v-tresses")).toEqual({
      id: "v-tresses",
      dureeMinutes: 90,
      prixCentimes: 6000,
    });
  });

  it("refuse une prestation à variantes sans variante, ou avec une variante inconnue", () => {
    expect(tarifDe(coiffage)).toBeUndefined();
    expect(tarifDe(coiffage, "v-inconnue")).toBeUndefined();
  });

  it("refuse une variante donnée à une prestation simple", () => {
    expect(tarifDe(simple, "v-tresses")).toBeUndefined();
  });
});

describe("resumeTarifs", () => {
  it("affiche durée et prix d'une prestation simple", () => {
    expect(resumeTarifs(simple, dureeLabel, prixLabel)).toEqual({ duree: "1 h", prix: "40 €" });
  });

  it("affiche la fourchette de durée et « à partir de » pour des variantes différentes", () => {
    expect(resumeTarifs(coiffage, dureeLabel, prixLabel)).toEqual({
      duree: "1 h – 1 h 30",
      prix: "à partir de 40 €",
    });
  });

  it("n'affiche pas de fourchette quand toutes les variantes ont le même tarif", () => {
    const memeTarif = {
      dureeMinutes: null,
      prixCentimes: null,
      variantes: [
        { id: "a", dureeMinutes: 60, prixCentimes: 4000 },
        { id: "b", dureeMinutes: 60, prixCentimes: 4000 },
      ],
    };
    expect(resumeTarifs(memeTarif, dureeLabel, prixLabel)).toEqual({ duree: "1 h", prix: "40 €" });
  });
});
