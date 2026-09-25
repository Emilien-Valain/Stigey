import { describe, expect, it } from "vitest";
import { messageCatalogue } from "./db-erreurs";

describe("messageCatalogue", () => {
  it("explique qu'une catégorie non vide ne peut pas être supprimée", () => {
    expect(messageCatalogue({ message: "categorie_non_vide" })).toMatch(/contient encore des soins/);
  });

  it("explique qu'un ordre périmé demande de recharger", () => {
    expect(messageCatalogue({ message: "ordre_incomplet" })).toMatch(/recharg/i);
  });

  it("explique qu'on ne range pas un soin dans une catégorie supprimée", () => {
    expect(messageCatalogue({ message: "categorie_inactive" })).toMatch(/catégorie/);
  });

  it("explique qu'une variante seule n'a pas de sens", () => {
    expect(messageCatalogue({ message: "variantes_insuffisantes" })).toMatch(/au moins deux variantes/);
  });

  it("demande la durée et le prix d'une prestation sans variante", () => {
    expect(messageCatalogue({ message: "duree_prix_requis" })).toMatch(/durée et le prix/);
  });

  it("demande de recharger quand la prestation ou une variante a disparu", () => {
    expect(messageCatalogue({ message: "variante_introuvable" })).toMatch(/recharg/i);
    expect(messageCatalogue({ message: "prestation_introuvable" })).toMatch(/recharg/i);
  });

  it("ne divulgue jamais le détail d'une erreur inconnue", () => {
    const message = messageCatalogue({ message: 'relation "prestations" violates row-level security' });

    expect(message).toBe("Une erreur est survenue. Réessayez dans un instant.");
    expect(message).not.toMatch(/prestations|row-level/);
  });
});
