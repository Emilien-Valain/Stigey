import { readdir } from "node:fs/promises";
import path from "node:path";
import { IMAGE_EXTENSIONS } from "@/lib/validation";

// Images proposables pour un Coup de cœur : tout fichier image déposé dans
// `public/images/` (ADR-0009). Ajouter une image = la committer dans ce dossier.
export async function listerImagesPrestations(): Promise<string[]> {
  const fichiers = await readdir(path.join(process.cwd(), "public", "images"));
  return fichiers
    .filter((f) => IMAGE_EXTENSIONS.test(f))
    .sort((a, b) => a.localeCompare(b))
    .map((f) => `/images/${f}`);
}
