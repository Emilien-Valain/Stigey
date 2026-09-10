#!/usr/bin/env node
// Harnais IA, pilier 7 (voir SKILL harnais-ia), tier 0 : budget de taille de
// bundle, seul check de perf pertinent tant que le trafic reste quasi nul.
//
// Next.js 16 a retiré le report de taille par route de `next build`
// (changelog officiel : "v16.0.0 | The JS bundle size metrics have been
// removed from next build") et remplacé ça par `next experimental-analyze`,
// un outil interactif dont la sortie (.next/diagnostics/analyze) est un
// format binaire pensé pour l'explorateur visuel, pas pour un script. Plutôt
// que de dépendre d'un format de manifest interne non documenté (fragile
// d'une version de Next à l'autre), ce script mesure directement ce qui est
// réellement livré au navigateur : la somme gzip de tous les chunks JS
// partagés (.next/static/chunks). C'est un budget global, pas par route —
// suffisant pour un Tier 0, à affiner en Tier 1+ si le projet grossit.
import { readdirSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";

const CHUNKS_DIR = path.join(process.cwd(), ".next/static/chunks");
// Mesuré le 2026-09-10 : ~201 KB gzip pour l'app actuelle. Seuil fixé avec
// une marge confortable plutôt que collé à la valeur mesurée, pour ne pas
// faire échouer le hook au moindre ajout de fonctionnalité légitime.
const BUDGET_BYTES = 300 * 1024;

function collectJsFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectJsFiles(fullPath));
    } else if (entry.name.endsWith(".js")) {
      files.push(fullPath);
    }
  }
  return files;
}

let files;
try {
  files = collectJsFiles(CHUNKS_DIR);
} catch {
  console.error(`Bundle introuvable (${CHUNKS_DIR}) — lancer "npm run build" avant ce check.`);
  process.exit(1);
}

const totalGzipBytes = files.reduce((sum, file) => {
  const content = readFileSync(file);
  return sum + gzipSync(content).length;
}, 0);

const totalKB = (totalGzipBytes / 1024).toFixed(1);
const budgetKB = (BUDGET_BYTES / 1024).toFixed(0);

if (totalGzipBytes > BUDGET_BYTES) {
  console.error(
    `Budget de bundle dépassé : ${totalKB} KB gzip (${files.length} fichiers) > ${budgetKB} KB.\n` +
      `Vérifier ce qui a été ajouté (nouvelle dépendance lourde ?) avant de relever le budget.`,
  );
  process.exit(1);
}

console.log(`Bundle JS : ${totalKB} KB gzip (${files.length} fichiers) — sous le budget de ${budgetKB} KB.`);
