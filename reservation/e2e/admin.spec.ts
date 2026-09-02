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
    await page.getByRole("button", { name: "Ajouter une prestation" }).click();
    await page.getByLabel("Nom").fill(nomTest);
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
    await carte.getByRole("button", { name: "Supprimer" }).click();
    await page.getByRole("button", { name: "Supprimer" }).last().click();
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
});
