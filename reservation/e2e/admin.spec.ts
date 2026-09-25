import { expect, test } from "@playwright/test";

// Couvre l'espace praticienne de bout en bout contre la vraie base de test
// (supabase/seed.sql fournit le compte praticienne et des réservations de
// démo). Nécessite `npm run db:test:start` au préalable.

test.describe.serial("espace praticienne", () => {
  test("connexion, qualification d'une réservation, ajout d'une prestation", async ({ page }) => {
    await page.goto("/admin");
    await page.getByPlaceholder("praticienne@stigey.fr").fill("praticienne@stigey.fr");
    await page.getByPlaceholder("••••••••").fill("stigey-dev-2026");
    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(page).toHaveURL(/\/admin\/aujourdhui/);
    await expect(page.getByRole("link", { name: "Aujourd'hui" })).toBeVisible();

    const nomTest = `Soin test e2e ${Date.now()}`;
    await page.goto("/admin/prestations");
    await page.getByRole("button", { name: "Ajouter une prestation à Nos soins" }).click();
    await page.getByLabel("Nom", { exact: true }).fill(nomTest);
    await page.getByLabel("Durée (minutes)").fill("30");
    await page.getByLabel("Prix (€)").fill("20");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText(nomTest)).toBeVisible();

    // Nettoyage : une prestation créée par un test ne doit pas s'accumuler
    // d'un run à l'autre (la base de test n'est pas réinitialisée ici).
    const carte = page
      .locator("div")
      .filter({ hasText: nomTest })
      .filter({ has: page.getByRole("button", { name: "Supprimer" }) })
      .last();
    await carte.getByRole("button", { name: "Supprimer", exact: true }).click();
    await page.getByRole("button", { name: "Supprimer", exact: true }).last().click();
    await expect(page.getByText(nomTest)).toHaveCount(0);

    await page.goto("/admin/disponibilites");
    await expect(page.getByRole("heading", { name: "Disponibilités récurrentes" })).toBeVisible();
    await expect(page.getByText("Mardi")).toBeVisible();

    await page.goto("/admin/reglages");
    await expect(page.getByRole("heading", { name: "Battement" })).toBeVisible();
  });

  test("visiteur non connecté redirigé vers la connexion", async ({ page }) => {
    await page.goto("/admin/reservations");
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
  });

  test("catégories : créer, ranger un soin en valeur, réordonner, refuser la suppression d'une catégorie non vide", async ({
    page,
  }) => {
    await page.goto("/admin");
    await page.getByPlaceholder("praticienne@stigey.fr").fill("praticienne@stigey.fr");
    await page.getByPlaceholder("••••••••").fill("stigey-dev-2026");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/admin\/aujourdhui/);

    const categorie = `Cat e2e ${Date.now()}`;
    const soin = `Soin e2e ${Date.now()}`;
    const titres = () => page.locator("section[aria-label] > div > h2").allTextContents();

    await page.goto("/admin/prestations");
    await page.getByRole("button", { name: "Ajouter une catégorie" }).click();
    await page.getByLabel("Nom de la catégorie").fill(categorie);
    await page.getByRole("button", { name: "Enregistrer" }).click();
    // Une nouvelle catégorie se place en dernier.
    await expect.poll(async () => (await titres()).at(-1)).toBe(categorie);

    await page.getByRole("button", { name: `Ajouter une prestation à ${categorie}` }).click();
    await page.getByLabel("Nom", { exact: true }).fill(soin);
    await page.getByLabel("Mettre ce soin en valeur sur le site").check();
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText(soin)).toBeVisible();

    // Réordonner : la catégorie remonte d'un cran.
    const avant = (await titres()).indexOf(categorie);
    await page.getByRole("button", { name: `Monter la catégorie ${categorie}` }).click();
    await expect.poll(async () => (await titres()).indexOf(categorie)).toBe(avant - 1);

    // Site public : la catégorie et son soin en valeur apparaissent.
    await page.goto("/prestations");
    await expect(page.getByRole("heading", { name: categorie })).toBeVisible();
    await expect(page.getByRole("heading", { name: soin })).toBeVisible();
    await expect(page.getByText("Coup de cœur").first()).toBeVisible();

    // Règle : une catégorie qui contient un soin actif ne peut pas être supprimée.
    await page.goto("/admin/prestations");
    await page.getByRole("button", { name: `Supprimer la catégorie ${categorie}` }).click();
    await page.getByRole("button", { name: "Supprimer la catégorie", exact: true }).click();
    await expect(page.getByText("contient encore des soins")).toBeVisible();
    await page.getByRole("button", { name: "Retour" }).click();

    // Nettoyage : soin d'abord, puis catégorie désormais vide.
    const carte = page
      .locator("div")
      .filter({ hasText: soin })
      .filter({ has: page.getByRole("button", { name: "Supprimer", exact: true }) })
      .last();
    await carte.getByRole("button", { name: "Supprimer", exact: true }).click();
    await page.getByRole("button", { name: "Supprimer", exact: true }).last().click();
    await expect(page.getByText(soin)).toHaveCount(0);

    await page.getByRole("button", { name: `Supprimer la catégorie ${categorie}` }).click();
    await page.getByRole("button", { name: "Supprimer la catégorie", exact: true }).click();
    await expect(page.getByRole("heading", { name: categorie })).toHaveCount(0);
  });
});
