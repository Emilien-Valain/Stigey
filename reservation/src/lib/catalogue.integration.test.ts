// Catalogue (Catégories → Prestations) : règles portées par la base — visibilité
// publique, droits d'écriture, réordonnancement atomique, désactivation d'une
// Catégorie. Test d'intégration contre le vrai Postgres de test local
// (`npm run db:test:start`), jamais de mock de la DB (ADR-0007). Les rôles
// `anon` / `authenticated` sont endossés pour éprouver la RLS et les GRANT :
// un superuser les contournerait et le test ne prouverait rien.
import { Client } from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

const CONNECTION_STRING = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

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
  // Un SAVEPOINT isole l'échec attendu (permission refusée) : sans lui, la
  // transaction du test passe en état « abandonnée » et le `reset role` du
  // finally échouerait (25P02), masquant l'erreur réellement testée.
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

async function creerCategorie(nom: string): Promise<string> {
  const { rows } = await client.query(
    `insert into categories_prestations (nom) values ($1) returning id`,
    [nom],
  );
  return rows[0].id as string;
}

async function creerPrestation(categorieId: string, nom: string): Promise<string> {
  const { rows } = await client.query(
    `insert into prestations (nom, duree_minutes, prix_centimes, categorie_id)
     values ($1, 60, 5000, $2) returning id`,
    [nom, categorieId],
  );
  return rows[0].id as string;
}

async function ordreCategories(): Promise<string[]> {
  const { rows } = await client.query(
    `select id from categories_prestations where actif order by ordre, created_at`,
  );
  return rows.map((r) => r.id as string);
}

async function ordrePrestations(categorieId: string): Promise<string[]> {
  const { rows } = await client.query(
    `select id from prestations where categorie_id = $1 and actif order by ordre`,
    [categorieId],
  );
  return rows.map((r) => r.id as string);
}

describe("catégories de prestations", () => {
  it("une nouvelle catégorie se place à la fin", async () => {
    const avant = await ordreCategories();
    const nouvelle = await creerCategorie("Massages");

    expect(await ordreCategories()).toEqual([...avant, nouvelle]);
  });

  it("le public (anon) ne voit que les catégories actives", async () => {
    const visible = await creerCategorie("Visible");
    const cachee = await creerCategorie("Cachée");
    await client.query(`update categories_prestations set actif = false where id = $1`, [cachee]);

    const { rows } = await commeRole("anon", () =>
      client.query(`select id from categories_prestations`),
    );
    const ids = rows.map((r) => r.id);

    expect(ids).toContain(visible);
    expect(ids).not.toContain(cachee);
  });

  it("le public (anon) ne peut ni créer ni modifier une catégorie", async () => {
    await expect(
      commeRole("anon", () =>
        client.query(`insert into categories_prestations (nom) values ('Pirate')`),
      ),
    ).rejects.toMatchObject({ code: "42501" });
  });

  it("refuse un nom vide", async () => {
    await expect(
      client.query(`insert into categories_prestations (nom) values ('   ')`),
    ).rejects.toMatchObject({ code: "23514" });
  });

  it("refuse de désactiver une catégorie qui contient des soins actifs", async () => {
    const categorie = await creerCategorie("Massages");
    await creerPrestation(categorie, "Massage relaxant");

    await expect(
      client.query(`update categories_prestations set actif = false where id = $1`, [categorie]),
    ).rejects.toThrow("categorie_non_vide");
  });

  it("désactive une catégorie dont tous les soins sont désactivés", async () => {
    const categorie = await creerCategorie("Massages");
    const soin = await creerPrestation(categorie, "Massage relaxant");
    await client.query(`update prestations set actif = false where id = $1`, [soin]);

    await expect(
      client.query(`update categories_prestations set actif = false where id = $1`, [categorie]),
    ).resolves.toBeDefined();
  });

  it("refuse de ranger un soin actif dans une catégorie désactivée", async () => {
    const categorie = await creerCategorie("Ancienne");
    await client.query(`update categories_prestations set actif = false where id = $1`, [categorie]);

    await expect(creerPrestation(categorie, "Soin orphelin")).rejects.toThrow("categorie_inactive");
  });
});

describe("réordonnancement des catégories", () => {
  it("applique le nouvel ordre", async () => {
    const a = await creerCategorie("A");
    const b = await creerCategorie("B");
    const tous = await ordreCategories();
    const renverse = [...tous].reverse();

    await commeRole("authenticated", () =>
      client.query(`select reordonner_categories($1::uuid[])`, [renverse]),
    );

    expect(await ordreCategories()).toEqual(renverse);
    expect(renverse.slice(0, 2)).toEqual([b, a]);
  });

  it("refuse un ordre incomplet (jamais d'écrasement partiel)", async () => {
    await creerCategorie("A");
    const b = await creerCategorie("B");

    await expect(
      client.query(`select reordonner_categories($1::uuid[])`, [[b]]),
    ).rejects.toThrow("ordre_incomplet");
  });

  it("refuse un identifiant étranger au catalogue", async () => {
    const tous = await ordreCategories();
    const etranger = "99999999-9999-4999-8999-999999999999";

    await expect(
      client.query(`select reordonner_categories($1::uuid[])`, [[...tous.slice(1), etranger]]),
    ).rejects.toThrow("ordre_incomplet");
  });

  it("n'est pas exécutable par le public (anon)", async () => {
    const tous = await ordreCategories();

    await expect(
      commeRole("anon", () => client.query(`select reordonner_categories($1::uuid[])`, [tous])),
    ).rejects.toMatchObject({ code: "42501" });
  });
});

describe("prestations dans une catégorie", () => {
  it("un nouveau soin se place à la fin de sa catégorie", async () => {
    const categorie = await creerCategorie("Massages");
    const premier = await creerPrestation(categorie, "Premier");
    const second = await creerPrestation(categorie, "Second");

    expect(await ordrePrestations(categorie)).toEqual([premier, second]);
  });

  it("applique le nouvel ordre des soins de la catégorie", async () => {
    const categorie = await creerCategorie("Massages");
    const premier = await creerPrestation(categorie, "Premier");
    const second = await creerPrestation(categorie, "Second");

    await commeRole("authenticated", () =>
      client.query(`select reordonner_prestations($1, $2::uuid[])`, [categorie, [second, premier]]),
    );

    expect(await ordrePrestations(categorie)).toEqual([second, premier]);
  });

  it("refuse un ordre qui mélange les soins d'une autre catégorie", async () => {
    const massages = await creerCategorie("Massages");
    const soins = await creerCategorie("Soins");
    const massage = await creerPrestation(massages, "Massage");
    const soin = await creerPrestation(soins, "Soin");

    await expect(
      client.query(`select reordonner_prestations($1, $2::uuid[])`, [massages, [massage, soin]]),
    ).rejects.toThrow("ordre_incomplet");
  });

  it("déplacer un soin vers une autre catégorie le place à la fin de celle-ci", async () => {
    const massages = await creerCategorie("Massages");
    const soins = await creerCategorie("Soins");
    const dejaLa = await creerPrestation(soins, "Déjà là");
    const voyageur = await creerPrestation(massages, "Voyageur");

    await client.query(`update prestations set categorie_id = $1 where id = $2`, [soins, voyageur]);

    expect(await ordrePrestations(soins)).toEqual([dejaLa, voyageur]);
  });

  it("plusieurs soins peuvent être mis en avant, aucun par défaut", async () => {
    const categorie = await creerCategorie("Massages");
    const a = await creerPrestation(categorie, "A");
    const b = await creerPrestation(categorie, "B");
    const c = await creerPrestation(categorie, "C");

    await client.query(`update prestations set mise_en_avant = true where id in ($1, $2)`, [a, b]);
    const { rows } = await client.query(
      `select id, mise_en_avant from prestations where id in ($1, $2, $3)`,
      [a, b, c],
    );
    const enAvant = new Set(rows.filter((r) => r.mise_en_avant).map((r) => r.id));

    expect(enAvant).toEqual(new Set([a, b]));
  });
});
