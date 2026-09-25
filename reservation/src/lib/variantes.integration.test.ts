// Variantes de prestation (CONTEXT.md : Variante, ADR-0010) : règles portées
// par la base — enregistrement atomique Prestation + Variantes, choix
// obligatoire à la réservation, durée/prix pris sur la Variante, instantané
// figé sur la Réservation, visibilité publique. Test d'intégration contre le
// vrai Postgres de test local (`npm run db:test:start`), jamais de mock de la
// DB (ADR-0007).
import { Client } from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

const CONNECTION_STRING = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const PRATICIENNE_ID = "11111111-1111-4111-8111-111111111111";
const JOUR = "2099-02-02"; // date hors seed, dédiée à ce test

let client: Client;

beforeAll(async () => {
  client = new Client({ connectionString: CONNECTION_STRING });
  await client.connect();
});

afterAll(async () => {
  await client.end();
});

// Chaque test tourne dans sa propre transaction, annulée à la fin.
beforeEach(async () => {
  await client.query("BEGIN");
});

afterEach(async () => {
  await client.query("ROLLBACK");
});

async function commeRole<T>(role: "anon" | "authenticated", action: () => Promise<T>): Promise<T> {
  // SAVEPOINT : voir catalogue.integration.test.ts (échec attendu sous un rôle).
  await client.query("savepoint role_test");
  await client.query(`set local role ${role}`);
  try {
    return await action();
  } catch (erreur) {
    await client.query("rollback to savepoint role_test");
    throw erreur;
  } finally {
    await client.query("reset role");
  }
}

// Un échec attendu abandonne la transaction du test ; le SAVEPOINT permet de
// continuer à requêter après (et d'enchaîner plusieurs refus dans un test).
async function echoue<T>(action: () => Promise<T>): Promise<T> {
  await client.query("savepoint refus");
  try {
    return await action();
  } catch (erreur) {
    await client.query("rollback to savepoint refus");
    throw erreur;
  }
}

async function creerCategorie(): Promise<string> {
  const { rows } = await client.query(
    `insert into categories_prestations (nom) values ('Coiffage') returning id`,
  );
  return rows[0].id as string;
}

type VarianteEntree = { id?: string; nom: string; duree_minutes: number; prix_centimes: number };

const TRESSES: VarianteEntree = { nom: "Tresses", duree_minutes: 90, prix_centimes: 6000 };
const CHIGNON: VarianteEntree = { nom: "Chignon", duree_minutes: 60, prix_centimes: 4000 };

async function enregistrer(
  categorieId: string,
  variantes: VarianteEntree[],
  { id = null, duree = 45, prix = 3000 }: { id?: string | null; duree?: number; prix?: number } = {},
): Promise<string> {
  const { rows } = await client.query(
    `select enregistrer_prestation($1, $2::jsonb, $3::jsonb) as id`,
    [
      id,
      JSON.stringify({
        nom: "Coiffage",
        categorie_id: categorieId,
        duree_minutes: duree,
        prix_centimes: prix,
        accroche: "",
        description: "",
        cible: "",
        mise_en_avant: false,
        image_url: "",
      }),
      JSON.stringify(variantes),
    ],
  );
  return rows[0].id as string;
}

async function variantes(prestationId: string, actives = true) {
  const { rows } = await client.query(
    `select id, nom, duree_minutes, prix_centimes, ordre, actif
     from variantes_prestations
     where prestation_id = $1 and ($2::boolean is false or actif)
     order by ordre`,
    [prestationId, actives],
  );
  return rows;
}

async function reserver(prestationId: string, varianteId: string | null, heure = "09:00") {
  const { rows } = await client.query(
    `select * from creer_reservation($1, $2, $3, $4, 'Alice', 'alice@test.fr', null, $5)`,
    [prestationId, PRATICIENNE_ID, JOUR, heure, varianteId],
  );
  return rows[0];
}

describe("enregistrer_prestation()", () => {
  it("crée une prestation simple sans variante : durée et prix propres", async () => {
    const id = await enregistrer(await creerCategorie(), []);

    const { rows } = await client.query(
      `select duree_minutes, prix_centimes from prestations where id = $1`,
      [id],
    );
    expect(rows[0]).toEqual({ duree_minutes: 45, prix_centimes: 3000 });
    expect(await variantes(id)).toEqual([]);
  });

  it("crée une prestation à variantes : durée et prix propres remis à NULL, variantes ordonnées", async () => {
    const id = await enregistrer(await creerCategorie(), [TRESSES, CHIGNON]);

    const { rows } = await client.query(
      `select duree_minutes, prix_centimes from prestations where id = $1`,
      [id],
    );
    expect(rows[0]).toEqual({ duree_minutes: null, prix_centimes: null });
    expect((await variantes(id)).map((v) => [v.nom, v.ordre])).toEqual([
      ["Tresses", 1],
      ["Chignon", 2],
    ]);
  });

  it("refuse une variante seule, rien n'est écrit", async () => {
    const categorie = await creerCategorie();
    const avant = await client.query(`select count(*) from prestations`);

    await expect(echoue(() => enregistrer(categorie, [TRESSES]))).rejects.toThrow("variantes_insuffisantes");

    const apres = await client.query(`select count(*) from prestations`);
    expect(apres.rows[0].count).toBe(avant.rows[0].count);
  });

  it("refuse une prestation simple sans durée ni prix", async () => {
    const categorie = await creerCategorie();
    await expect(
      client.query(
        `select enregistrer_prestation(null, $1::jsonb, '[]'::jsonb)`,
        [JSON.stringify({ nom: "X", categorie_id: categorie, mise_en_avant: false })],
      ),
    ).rejects.toThrow("duree_prix_requis");
  });

  it("réordonne, modifie et désactive les variantes retirées de la liste (jamais de suppression)", async () => {
    const categorie = await creerCategorie();
    const id = await enregistrer(categorie, [TRESSES, CHIGNON]);
    const [tresses, chignon] = await variantes(id);

    await enregistrer(
      categorie,
      [
        { id: chignon.id, nom: "Chignon", duree_minutes: 75, prix_centimes: 4500 },
        { nom: "Boucles", duree_minutes: 30, prix_centimes: 2500 },
      ],
      { id },
    );

    expect((await variantes(id)).map((v) => [v.nom, v.duree_minutes, v.ordre])).toEqual([
      ["Chignon", 75, 1],
      ["Boucles", 30, 2],
    ]);
    const retiree = (await variantes(id, false)).find((v) => v.id === tresses.id);
    expect(retiree).toMatchObject({ actif: false, nom: "Tresses" });
  });

  it("repasser à zéro variante rend la prestation simple et désactive toutes les variantes", async () => {
    const categorie = await creerCategorie();
    const id = await enregistrer(categorie, [TRESSES, CHIGNON]);

    await enregistrer(categorie, [], { id, duree: 50, prix: 3500 });

    const { rows } = await client.query(
      `select duree_minutes, prix_centimes from prestations where id = $1`,
      [id],
    );
    expect(rows[0]).toEqual({ duree_minutes: 50, prix_centimes: 3500 });
    expect(await variantes(id)).toEqual([]);
  });

  it("refuse de toucher la variante d'une autre prestation", async () => {
    const categorie = await creerCategorie();
    const autre = await enregistrer(categorie, [TRESSES, CHIGNON]);
    const [etrangere] = await variantes(autre);
    const id = await enregistrer(categorie, []);

    await expect(
      enregistrer(categorie, [{ ...CHIGNON, id: etrangere.id }, TRESSES], { id }),
    ).rejects.toThrow("variante_introuvable");
  });

  it("n'est pas appelable par le public (anon)", async () => {
    await expect(
      commeRole("anon", () => client.query(`select enregistrer_prestation(null, '{}'::jsonb, '[]'::jsonb)`)),
    ).rejects.toMatchObject({ code: "42501" });
  });
});

describe("visibilité publique des variantes", () => {
  it("le public (anon) ne voit que les variantes actives", async () => {
    const categorie = await creerCategorie();
    const id = await enregistrer(categorie, [TRESSES, CHIGNON]);
    const [tresses] = await variantes(id);
    await client.query(`update variantes_prestations set actif = false where id = $1`, [tresses.id]);

    const { rows } = await commeRole("anon", () =>
      client.query(`select nom from variantes_prestations where prestation_id = $1`, [id]),
    );

    expect(rows.map((r) => r.nom)).toEqual(["Chignon"]);
  });

  it("le public (anon) ne peut ni créer ni modifier une variante", async () => {
    const id = await enregistrer(await creerCategorie(), [TRESSES, CHIGNON]);

    await expect(
      commeRole("anon", () =>
        client.query(
          `insert into variantes_prestations (prestation_id, nom, duree_minutes, prix_centimes)
           values ($1, 'Pirate', 1, 0)`,
          [id],
        ),
      ),
    ).rejects.toMatchObject({ code: "42501" });
  });
});

describe("creer_reservation() avec variantes", () => {
  it("prend la durée de la variante choisie et fige son nom et son prix", async () => {
    const id = await enregistrer(await creerCategorie(), [TRESSES, CHIGNON]);
    const [tresses] = await variantes(id);

    const resa = await reserver(id, tresses.id);

    expect(resa.heure_fin).toBe("10:30:00"); // 09:00 + 90 min (Tresses)
    expect(resa).toMatchObject({
      variante_id: tresses.id,
      variante_nom: "Tresses",
      prix_centimes: 6000,
    });
  });

  it("refuse une prestation à variantes sans variante choisie", async () => {
    const id = await enregistrer(await creerCategorie(), [TRESSES, CHIGNON]);

    await expect(echoue(() => reserver(id, null))).rejects.toThrow("variante_invalide");
  });

  it("refuse une variante inconnue, désactivée ou d'une autre prestation", async () => {
    const categorie = await creerCategorie();
    const id = await enregistrer(categorie, [TRESSES, CHIGNON]);
    const [tresses] = await variantes(id);
    const [autreVariante] = await variantes(await enregistrer(categorie, [TRESSES, CHIGNON]));
    await client.query(`update variantes_prestations set actif = false where id = $1`, [tresses.id]);

    await expect(echoue(() => reserver(id, tresses.id))).rejects.toThrow("variante_invalide");
    await expect(echoue(() => reserver(id, autreVariante.id))).rejects.toThrow("variante_invalide");
    await expect(
      echoue(() => reserver(id, "00000000-0000-4000-8000-0000000000ff")),
    ).rejects.toThrow(
      "variante_invalide",
    );
  });

  it("refuse une variante donnée à une prestation simple", async () => {
    const categorie = await creerCategorie();
    const simple = await enregistrer(categorie, []);
    const [variante] = await variantes(await enregistrer(categorie, [TRESSES, CHIGNON]));

    await expect(reserver(simple, variante.id)).rejects.toThrow("variante_invalide");
  });

  it("réserve une prestation simple sans variante, et fige son prix", async () => {
    const id = await enregistrer(await creerCategorie(), []);

    const resa = await reserver(id, null);

    expect(resa.heure_fin).toBe("09:45:00"); // 09:00 + 45 min
    expect(resa).toMatchObject({ variante_id: null, variante_nom: null, prix_centimes: 3000 });
  });

  it("modifier ou désactiver la variante ne réécrit pas la réservation déjà prise", async () => {
    const categorie = await creerCategorie();
    const id = await enregistrer(categorie, [TRESSES, CHIGNON]);
    const [tresses, chignon] = await variantes(id);
    const resa = await reserver(id, tresses.id);

    await enregistrer(
      categorie,
      [
        { id: chignon.id, nom: "Chignon", duree_minutes: 60, prix_centimes: 4000 },
        { id: tresses.id, nom: "Tresses XL", duree_minutes: 120, prix_centimes: 9000 },
      ],
      { id },
    );
    await enregistrer(categorie, [CHIGNON, { ...TRESSES, nom: "Autre" }], { id });

    const { rows } = await client.query(
      `select heure_fin, variante_nom, prix_centimes from reservations where id = $1`,
      [resa.id],
    );
    expect(rows[0]).toEqual({ heure_fin: "10:30:00", variante_nom: "Tresses", prix_centimes: 6000 });
  });
});
