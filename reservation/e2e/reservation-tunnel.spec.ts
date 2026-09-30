import { expect, test } from "@playwright/test";

// Couvre la navigation du tunnel de réservation (étapes 1 à 4), contre la
// vraie base de test (supabase/seed.sql : prestations, semaine type, aucune
// réservation le jour choisi). Nécessite `npm run db:test:start` au préalable.

test("un client peut aller du choix du soin jusqu'à la confirmation", async ({ page }) => {
  await page.goto("/reservation");

  await page.getByRole("button", { name: /Diagnostic du cuir chevelu/ }).click();
  await expect(page.getByRole("heading", { name: "Choisissez votre créneau" })).toBeVisible();

  // Le seed remplit délibérément le jour courant (vue admin de démo) et pose
  // une indisponibilité à +10 jours : on ne peut donc pas supposer que le
  // premier jour affiché a un créneau libre. On essaie les jours dans l'ordre
  // jusqu'à en trouver un qui en a — robuste au jour/heure d'exécution.
  const jours = page.locator("[data-scroll] button");
  const nbJours = await jours.count();
  const creneauLibre = page.getByRole("button", { name: /^\d{1,2}:\d{2}$/ }).first();
  let trouve = false;
  for (let i = 0; i < nbJours; i++) {
    await jours.nth(i).click();
    // Les créneaux se chargent en asynchrone : sans cette attente, on
    // conclurait « pas de créneau » avant même qu'ils soient arrivés.
    await expect(page.getByText("Chargement des créneaux…")).toBeHidden();
    if (await creneauLibre.isVisible().catch(() => false)) {
      trouve = true;
      break;
    }
  }
  expect(trouve, "aucun jour affiché n'a de créneau libre").toBe(true);
  await creneauLibre.click();

  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByRole("heading", { name: "Vos coordonnées" })).toBeVisible();

  await page.getByPlaceholder("Awa Diallo").fill("Test Client");
  await page.getByPlaceholder("awa@exemple.fr").fill("test.client@example.com");
  await page.locator('button[aria-pressed="false"]').click();

  await page.getByRole("button", { name: "Confirmer ma réservation" }).click();
  await expect(page.getByRole("heading", { name: "C'est réservé." })).toBeVisible();
});

test("une carte de l'accueil mène au créneau avec le soin présélectionné", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: /Diagnostic du cuir chevelu/ }).click();
  await expect(page).toHaveURL(/\/reservation\?soin=/);
  await expect(page.getByRole("heading", { name: "Choisissez votre créneau" })).toBeVisible();
});

test("le bouton « Réserver ce soin » des prestations mène au créneau", async ({ page }) => {
  await page.goto("/prestations");

  await page.getByRole("link", { name: "Réserver ce soin" }).first().click();
  await expect(page.getByRole("heading", { name: "Choisissez votre créneau" })).toBeVisible();
});

test("un soin inconnu dans le lien laisse le tunnel à l'étape 1", async ({ page }) => {
  await page.goto("/reservation?soin=inconnu");

  await expect(page.getByRole("heading", { name: "Quel soin souhaitez-vous ?" })).toBeVisible();
});
