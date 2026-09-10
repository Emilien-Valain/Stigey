// Zone à risque n°1 (ADR-0007) : unicité atomique anti-sur-réservation
// (ADR-0001). Test d'intégration contre le vrai Postgres de test local
// (`npm run db:test:start`), jamais de mock de la DB — un mock laisserait
// passer une régression sur la contrainte d'exclusion Postgres elle-même.
import { Client } from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

const CONNECTION_STRING = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const PRATICIENNE_ID = "11111111-1111-4111-8111-111111111111";
const PRESTATION_ID = "00000000-0000-4000-8000-000000000001"; // Diagnostic, 60 min
const JOUR = "2099-01-05"; // date hors seed, dédiée à ce test

let client: Client;

beforeAll(async () => {
  client = new Client({ connectionString: CONNECTION_STRING });
  await client.connect();
});

afterAll(async () => {
  await client.end();
});

// Chaque test tourne dans sa propre transaction, annulée à la fin : pas de
// nettoyage manuel, pas de pollution du jeu de seed.
beforeEach(async () => {
  await client.query("BEGIN");
});

afterEach(async () => {
  await client.query("ROLLBACK");
});

async function inserer(heureDebut: string, heureFin: string, statut = "confirmee") {
  return client.query(
    `insert into reservations
      (praticienne_id, prestation_id, nom, email, jour, heure_debut, heure_fin, statut)
     values ($1, $2, 'Test', 'test@test.fr', $3, $4, $5, $6)`,
    [PRATICIENNE_ID, PRESTATION_ID, JOUR, heureDebut, heureFin, statut],
  );
}

describe("contrainte d'exclusion sur reservations (ADR-0001)", () => {
  it("refuse deux réservations confirmées qui se chevauchent pour la même praticienne", async () => {
    await inserer("10:00", "11:00");
    await expect(inserer("10:30", "11:30")).rejects.toMatchObject({ code: "23P01" });
  });

  it("accepte deux réservations adjacentes (pas de chevauchement)", async () => {
    await inserer("10:00", "11:00");
    await expect(inserer("11:00", "12:00")).resolves.toBeDefined();
  });

  it("une réservation Annulée ne bloque pas un nouveau créneau qui la recouvre", async () => {
    await inserer("10:00", "11:00", "annulee");
    await expect(inserer("10:00", "11:00")).resolves.toBeDefined();
  });

  it("une réservation Honorée bloque toujours le créneau (contrairement à Annulée)", async () => {
    await inserer("10:00", "11:00", "honoree");
    await expect(inserer("10:30", "11:30")).rejects.toMatchObject({ code: "23P01" });
  });

  it("un Report (UPDATE) qui percute une réservation existante est refusé", async () => {
    await inserer("09:00", "10:00");
    await inserer("14:00", "15:00");
    const { rows } = await client.query(
      `select id from reservations where jour = $1 and heure_debut = '14:00'`,
      [JOUR],
    );
    const idADeplacer = rows[0].id as string;

    await expect(
      client.query(`update reservations set heure_debut = '09:30', heure_fin = '10:30' where id = $1`, [
        idADeplacer,
      ]),
    ).rejects.toMatchObject({ code: "23P01" });
  });

  it("deux connexions séparées qui insèrent le même créneau en même temps : une seule passe", async () => {
    // Contrairement aux tests ci-dessus (une seule connexion, inserts
    // séquentiels dans la même transaction), ce test prouve que la
    // contrainte d'exclusion Postgres tient sous vraie concurrence : deux
    // clients distincts, hors de la transaction englobante du test, qui
    // écrivent en même temps sur le créneau. Un test séquentiel prouve que
    // la contrainte existe ; celui-ci prouve qu'elle tient sous charge réelle.
    const clientA = new Client({ connectionString: CONNECTION_STRING });
    const clientB = new Client({ connectionString: CONNECTION_STRING });
    await clientA.connect();
    await clientB.connect();

    try {
      const inserer = (client: Client) =>
        client.query(
          `insert into reservations
            (praticienne_id, prestation_id, nom, email, jour, heure_debut, heure_fin, statut)
           values ($1, $2, 'Test', 'test@test.fr', $3, '13:00', '14:00', 'confirmee')`,
          [PRATICIENNE_ID, PRESTATION_ID, JOUR],
        );

      const [resultA, resultB] = await Promise.allSettled([inserer(clientA), inserer(clientB)]);

      try {
        const outcomes = [resultA, resultB];
        const fulfilled = outcomes.filter((r) => r.status === "fulfilled");
        const rejected = outcomes.filter((r) => r.status === "rejected");

        expect(fulfilled).toHaveLength(1);
        expect(rejected).toHaveLength(1);
        // Sous vraie concurrence, Postgres peut renvoyer soit une violation
        // propre de la contrainte d'exclusion (23P01), soit un deadlock
        // (40P01, les deux transactions se verrouillent pendant la
        // vérification de l'index GiST) — les deux prouvent que le
        // double-booking a été empêché. Le code applicatif doit gérer les
        // deux (voir src/lib/db-erreurs.ts et son usage dans les actions).
        const code = (rejected[0] as PromiseRejectedResult).reason?.code;
        expect(["23P01", "40P01"]).toContain(code);
      } finally {
        // Nettoyage, même si les assertions ci-dessus échouent : cet insert a
        // été fait en autocommit sur clientA/clientB, hors de la transaction
        // BEGIN/ROLLBACK du test (celle de `client`) — le rollback global ne
        // l'efface pas. Sans ce nettoyage garanti, un test qui échoue laisse
        // une ligne orpheline qui fait échouer les runs suivants pour une
        // raison différente (créneau déjà pris par un run précédent).
        await clientA.query(
          `delete from reservations where jour = $1 and heure_debut = '13:00' and praticienne_id = $2`,
          [JOUR, PRATICIENNE_ID],
        );
      }
    } finally {
      await clientA.end();
      await clientB.end();
    }
  });

  it("creer_reservation() calcule heure_fin depuis la durée et respecte la contrainte", async () => {
    const premiere = await client.query(
      `select * from creer_reservation($1, $2, $3, '09:00', 'Alice', 'alice@test.fr', null)`,
      [PRESTATION_ID, PRATICIENNE_ID, JOUR],
    );
    expect(premiere.rows[0].heure_fin).toBe("10:00:00"); // 09:00 + 60 min (Diagnostic)

    await expect(
      client.query(
        `select * from creer_reservation($1, $2, $3, '09:30', 'Bob', 'bob@test.fr', null)`,
        [PRESTATION_ID, PRATICIENNE_ID, JOUR],
      ),
    ).rejects.toMatchObject({ code: "23P01" });
  });
});
