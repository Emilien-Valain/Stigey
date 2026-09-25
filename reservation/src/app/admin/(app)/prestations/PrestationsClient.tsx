"use client";

import Image from "next/image";
import { useState } from "react";
import Modal from "@/components/admin/Modal";
import type { Categorie, Prestation } from "@/lib/data/prestations";
import { deplacer, grouperParCategorie } from "@/lib/catalogue";
import {
  enregistrerPrestation,
  desactiverPrestation,
  reordonnerPrestations,
} from "@/lib/actions/prestations-admin";
import {
  creerCategorie,
  renommerCategorie,
  reordonnerCategories,
  supprimerCategorie,
} from "@/lib/actions/categories-admin";
import type { ResultatAction } from "@/lib/actions/resultat";

// Voir CONTEXT.md : Variante. `cle` identifie la ligne dans le formulaire
// (les nouvelles n'ont pas encore d'id en base).
type FormVariante = { cle: string; id?: string; nom: string; duree: number; prix: number };

type Form = {
  id?: string;
  categorieId: string;
  miseEnAvant: boolean;
  image: string;
  nom: string;
  duree: number;
  prix: number;
  accroche: string;
  description: string;
  cible: string;
  // Vide = prestation simple (durée et prix ci-dessus) ; sinon ce sont les
  // variantes qui portent durée et prix.
  variantes: FormVariante[];
};

type FormCategorie = { id?: string; nom: string };

function versForm(categorieId: string, p?: Prestation): Form {
  return p
    ? {
        id: p.id,
        categorieId: p.categorieId,
        miseEnAvant: p.miseEnAvant,
        image: p.image,
        nom: p.nom,
        duree: p.dureeMinutes ?? 60,
        prix: Math.round((p.prixCentimes ?? 0) / 100),
        accroche: p.accroche,
        description: p.description,
        cible: p.cible,
        variantes: p.variantes.map((v) => ({
          cle: v.id,
          id: v.id,
          nom: v.nom,
          duree: v.dureeMinutes,
          prix: Math.round(v.prixCentimes / 100),
        })),
      }
    : {
        categorieId,
        miseEnAvant: false,
        image: "",
        nom: "",
        duree: 60,
        prix: 0,
        accroche: "",
        description: "",
        cible: "",
        variantes: [],
      };
}

function nouvelleVariante(duree: number, prix: number): FormVariante {
  return { cle: crypto.randomUUID(), nom: "", duree, prix };
}

export default function PrestationsClient({
  categories,
  prestations,
  images,
}: {
  categories: Categorie[];
  prestations: Prestation[];
  images: string[];
}) {
  const [form, setForm] = useState<Form | null>(null);
  const [formCategorie, setFormCategorie] = useState<FormCategorie | null>(null);
  const [suppression, setSuppression] = useState<Prestation | null>(null);
  const [suppressionCategorie, setSuppressionCategorie] = useState<Categorie | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [erreurGlobale, setErreurGlobale] = useState("");

  const groupes = grouperParCategorie(categories, prestations);

  // Exécute une action serveur et remonte son message d'erreur éventuel ;
  // renvoie true quand elle a réussi.
  async function executer(action: () => Promise<ResultatAction>, surErreur: (m: string) => void) {
    setEnvoi(true);
    const resultat = await action();
    setEnvoi(false);
    if (resultat.error) {
      surErreur(resultat.error);
      return false;
    }
    return true;
  }

  async function enregistrer() {
    if (!form) return;
    const aDesVariantes = form.variantes.length > 0;
    if (!form.nom.trim() || (!aDesVariantes && !form.duree)) {
      setErreur("Nom et durée sont nécessaires.");
      return;
    }
    const ok = await executer(
      () =>
        enregistrerPrestation({
          id: form.id,
          categorieId: form.categorieId,
          miseEnAvant: form.miseEnAvant,
          image: form.image,
          nom: form.nom,
          dureeMinutes: form.duree,
          prixCentimes: Math.round(form.prix * 100),
          variantes: form.variantes.map((v) => ({
            id: v.id,
            nom: v.nom,
            dureeMinutes: v.duree,
            prixCentimes: Math.round(v.prix * 100),
          })),
          accroche: form.accroche,
          description: form.description,
          cible: form.cible,
        }),
      setErreur,
    );
    if (ok) setForm(null);
  }

  async function confirmerSuppression() {
    if (!suppression) return;
    const ok = await executer(() => desactiverPrestation(suppression.id), setErreurGlobale);
    if (ok) setSuppression(null);
  }

  async function enregistrerCategorie() {
    if (!formCategorie) return;
    const ok = await executer(
      () =>
        formCategorie.id
          ? renommerCategorie(formCategorie.id, { nom: formCategorie.nom })
          : creerCategorie({ nom: formCategorie.nom }),
      setErreur,
    );
    if (ok) setFormCategorie(null);
  }

  async function confirmerSuppressionCategorie() {
    if (!suppressionCategorie) return;
    const ok = await executer(() => supprimerCategorie(suppressionCategorie.id), setErreur);
    if (ok) setSuppressionCategorie(null);
  }

  async function deplacerCategorie(id: string, sens: "haut" | "bas") {
    setErreurGlobale("");
    await executer(
      () => reordonnerCategories(deplacer(categories.map((c) => c.id), id, sens)),
      setErreurGlobale,
    );
  }

  async function deplacerPrestation(categorieId: string, id: string, sens: "haut" | "bas") {
    setErreurGlobale("");
    const ids = prestations.filter((p) => p.categorieId === categorieId).map((p) => p.id);
    await executer(
      () => reordonnerPrestations(categorieId, deplacer(ids, id, sens)),
      setErreurGlobale,
    );
  }

  function majVariante(cle: string, changes: Partial<FormVariante>) {
    setForm((f) =>
      f ? { ...f, variantes: f.variantes.map((v) => (v.cle === cle ? { ...v, ...changes } : v)) } : f,
    );
  }

  function ajouterVariante() {
    setForm((f) => {
      if (!f) return f;
      // La première fois, on en propose deux d'un coup (une seule n'a pas de
      // sens) en repartant de la durée et du prix déjà saisis.
      const nouvelles =
        f.variantes.length === 0
          ? [nouvelleVariante(f.duree, f.prix), nouvelleVariante(f.duree, f.prix)]
          : [nouvelleVariante(f.duree, f.prix)];
      return { ...f, variantes: [...f.variantes, ...nouvelles] };
    });
  }

  function retirerVariante(cle: string) {
    setForm((f) => (f ? { ...f, variantes: f.variantes.filter((v) => v.cle !== cle) } : f));
  }

  function deplacerVariante(cle: string, sens: "haut" | "bas") {
    setForm((f) => {
      if (!f) return f;
      const ordre = deplacer(f.variantes.map((v) => v.cle), cle, sens);
      return { ...f, variantes: ordre.map((c) => f.variantes.find((v) => v.cle === c)!) };
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <div className="font-sans text-[9.5px] font-bold tracking-[0.22em] text-brownred uppercase">
            Catalogue
          </div>
          <h1 className="mt-2 font-serif text-[29px] font-normal md:text-[36px]">Prestations</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormCategorie({ nom: "" });
            setErreur("");
          }}
          className="min-h-[46px] rounded-full bg-sunflower px-[22px] py-3.5 font-sans text-[10.5px] font-bold tracking-[0.14em] text-coffee uppercase"
        >
          Ajouter une catégorie
        </button>
      </div>

      {erreurGlobale && (
        <div
          role="alert"
          className="mt-4 rounded-[10px] bg-brownred/10 px-3.5 py-2.5 text-[12.5px] text-brownred"
        >
          {erreurGlobale}
        </div>
      )}

      {groupes.length === 0 && (
        <p className="mt-6 text-[13.5px] leading-[1.6] text-clay">
          Créez une première catégorie (par exemple « Soins du cuir chevelu ») pour y ranger vos
          prestations.
        </p>
      )}

      {groupes.map(({ categorie, prestations: soins }, indexCategorie) => (
        <section key={categorie.id} aria-label={categorie.nom} className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-coffee/[.14] pb-3">
            <h2 className="font-serif text-2xl leading-tight">{categorie.nom}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <BoutonOrdre
                sens="haut"
                libelle={`Monter la catégorie ${categorie.nom}`}
                desactive={envoi || indexCategorie === 0}
                onClick={() => deplacerCategorie(categorie.id, "haut")}
              />
              <BoutonOrdre
                sens="bas"
                libelle={`Descendre la catégorie ${categorie.nom}`}
                desactive={envoi || indexCategorie === groupes.length - 1}
                onClick={() => deplacerCategorie(categorie.id, "bas")}
              />
              <button
                type="button"
                onClick={() => {
                  setFormCategorie({ id: categorie.id, nom: categorie.nom });
                  setErreur("");
                }}
                aria-label={`Renommer la catégorie ${categorie.nom}`}
                className="min-h-[44px] rounded-full bg-coffee/[0.06] px-4 text-[10px] font-bold tracking-[0.14em] text-coffee uppercase"
              >
                Renommer
              </button>
              <button
                type="button"
                onClick={() => {
                  setSuppressionCategorie(categorie);
                  setErreur("");
                }}
                aria-label={`Supprimer la catégorie ${categorie.nom}`}
                className="min-h-[44px] rounded-full border border-brownred/35 px-4 text-[10px] font-bold tracking-[0.14em] text-brownred uppercase"
              >
                Supprimer
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
            {soins.map((p, indexSoin) => (
              <div
                key={p.id}
                className={`flex flex-col rounded-[18px] p-5 ${p.miseEnAvant ? "bg-cottonrose" : "bg-white"}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-serif text-xl leading-tight">{p.nom}</div>
                  {p.miseEnAvant && (
                    <span className="shrink-0 rounded-full bg-brownred px-2.5 py-1 font-sans text-[8.5px] font-bold tracking-[0.16em] text-ivory uppercase">
                      En valeur
                    </span>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2 font-sans text-[10.5px] font-bold tracking-[0.13em] text-brownred uppercase">
                  <span>{p.duree}</span>
                  <span className="h-[3px] w-[3px] rounded-full bg-sand" />
                  <span>{p.prix}</span>
                </div>
                {p.variantes.length > 0 && (
                  <ul className="mt-2.5 flex flex-col gap-1 text-[12px] leading-[1.4] text-clay">
                    {p.variantes.map((v) => (
                      <li key={v.id}>
                        {v.nom} · {v.duree} · {v.prix}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-[13px] leading-[1.6] text-clay">{p.accroche}</p>
                <div className="mt-3.5 font-sans text-[9.5px] font-bold tracking-[0.18em] text-taupe uppercase">
                  S&apos;adresse à
                </div>
                <p className="mt-1 text-[12.5px] leading-[1.55] text-clay">{p.cible}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-[18px]">
                  <BoutonOrdre
                    sens="haut"
                    libelle={`Monter ${p.nom}`}
                    desactive={envoi || indexSoin === 0}
                    onClick={() => deplacerPrestation(categorie.id, p.id, "haut")}
                  />
                  <BoutonOrdre
                    sens="bas"
                    libelle={`Descendre ${p.nom}`}
                    desactive={envoi || indexSoin === soins.length - 1}
                    onClick={() => deplacerPrestation(categorie.id, p.id, "bas")}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setForm(versForm(categorie.id, p));
                      setErreur("");
                    }}
                    className="min-h-[44px] flex-1 rounded-full bg-coffee/[0.06] text-[10px] font-bold tracking-[0.14em] text-coffee uppercase"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSuppression(p);
                      setErreurGlobale("");
                    }}
                    className="min-h-[44px] rounded-full border border-brownred/35 px-4 text-[10px] font-bold tracking-[0.14em] text-brownred uppercase"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              setForm(versForm(categorie.id));
              setErreur("");
            }}
            aria-label={`Ajouter une prestation à ${categorie.nom}`}
            className="mt-3 min-h-[46px] rounded-full bg-coffee/[0.06] px-[22px] py-3.5 font-sans text-[10.5px] font-bold tracking-[0.14em] text-coffee uppercase"
          >
            Ajouter une prestation
          </button>
        </section>
      ))}

      {form && (
        <Modal onClose={() => setForm(null)} maxWidth="560px">
          <div className="font-sans text-[9.5px] font-bold tracking-[0.2em] text-taupe uppercase">
            Prestation
          </div>
          <div className="mt-1.5 font-serif text-[25px]">
            {form.id ? "Modifier la prestation" : "Nouvelle prestation"}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <div className="md:col-span-2">
              <Champ label="Nom">
                <Input value={form.nom} onChange={(v) => setForm({ ...form, nom: v })} />
              </Champ>
            </div>
            <div className="md:col-span-2">
              <Champ label="Catégorie">
                <select
                  value={form.categorieId}
                  onChange={(e) => setForm({ ...form, categorieId: e.target.value })}
                  className="w-full rounded-[10px] border border-coffee/[.18] bg-white px-3.5 py-3.5 text-sm text-coffee"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom}
                    </option>
                  ))}
                </select>
              </Champ>
            </div>
            {form.variantes.length === 0 && (
              <>
              <div>
                <Champ label="Durée (minutes)">
                  <Input
                    type="number"
                    min={15}
                    step={5}
                    value={String(form.duree)}
                    onChange={(v) => setForm({ ...form, duree: Number(v) })}
                  />
                </Champ>
              </div>
              <div>
                <Champ label="Prix (€)">
                  <Input
                    type="number"
                    min={0}
                    step={5}
                    value={String(form.prix)}
                    onChange={(v) => setForm({ ...form, prix: Number(v) })}
                  />
                </Champ>
              </div>
              </>
            )}
            <fieldset className="md:col-span-2">
              <legend className="mb-1.5 font-sans text-[9.5px] font-bold tracking-[0.2em] text-taupe uppercase">
                Variantes (facultatives)
              </legend>
              {form.variantes.length === 0 ? (
                <p className="text-[12.5px] leading-[1.55] text-clay">
                  Pour proposer plusieurs durées ou prix au choix de la cliente (par exemple selon
                  la coiffure), ajoutez des variantes : elles remplacent la durée et le prix
                  ci-dessus.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {form.variantes.map((v, index) => (
                    <div key={v.cle} className="rounded-[12px] bg-coffee/[0.04] p-3">
                      <Champ label="Nom de la variante">
                        <Input value={v.nom} onChange={(nom) => majVariante(v.cle, { nom })} />
                      </Champ>
                      <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                        <Champ label="Durée (minutes)">
                          <Input
                            type="number"
                            min={15}
                            step={5}
                            value={String(v.duree)}
                            onChange={(duree) => majVariante(v.cle, { duree: Number(duree) })}
                          />
                        </Champ>
                        <Champ label="Prix (€)">
                          <Input
                            type="number"
                            min={0}
                            step={5}
                            value={String(v.prix)}
                            onChange={(prix) => majVariante(v.cle, { prix: Number(prix) })}
                          />
                        </Champ>
                      </div>
                      <div className="mt-2.5 flex gap-2">
                        <BoutonOrdre
                          sens="haut"
                          libelle={`Monter la variante ${v.nom || index + 1}`}
                          desactive={index === 0}
                          onClick={() => deplacerVariante(v.cle, "haut")}
                        />
                        <BoutonOrdre
                          sens="bas"
                          libelle={`Descendre la variante ${v.nom || index + 1}`}
                          desactive={index === form.variantes.length - 1}
                          onClick={() => deplacerVariante(v.cle, "bas")}
                        />
                        <button
                          type="button"
                          onClick={() => retirerVariante(v.cle)}
                          aria-label={`Retirer la variante ${v.nom || index + 1}`}
                          className="min-h-[44px] rounded-full border border-brownred/35 px-4 text-[10px] font-bold tracking-[0.14em] text-brownred uppercase"
                        >
                          Retirer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={ajouterVariante}
                className="mt-3 min-h-[44px] rounded-full bg-coffee/[0.06] px-5 text-[10px] font-bold tracking-[0.14em] text-coffee uppercase"
              >
                Ajouter une variante
              </button>
            </fieldset>
            <div className="md:col-span-2">
              <Champ label="Accroche courte">
                <Input value={form.accroche} onChange={(v) => setForm({ ...form, accroche: v })} />
              </Champ>
            </div>
            <div className="md:col-span-2">
              <Champ label="Description">
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full resize-y rounded-[10px] border border-coffee/[.18] bg-white px-3.5 py-3.5 text-sm leading-[1.55] text-coffee"
                />
              </Champ>
            </div>
            <div className="md:col-span-2">
              <Champ label="À qui ça s'adresse">
                <textarea
                  rows={2}
                  value={form.cible}
                  onChange={(e) => setForm({ ...form, cible: e.target.value })}
                  className="w-full resize-y rounded-[10px] border border-coffee/[.18] bg-white px-3.5 py-3.5 text-sm leading-[1.55] text-coffee"
                />
              </Champ>
            </div>
            <label className="flex min-h-[44px] items-center gap-3 md:col-span-2">
              <input
                type="checkbox"
                checked={form.miseEnAvant}
                onChange={(e) => setForm({ ...form, miseEnAvant: e.target.checked })}
                className="h-5 w-5 accent-brownred"
              />
              <span className="text-[13.5px] leading-[1.4] text-coffee">
                Mettre ce soin en valeur sur le site
              </span>
            </label>
            {form.miseEnAvant && (
              <fieldset className="md:col-span-2">
                <legend className="mb-1.5 font-sans text-[9.5px] font-bold tracking-[0.2em] text-taupe uppercase">
                  Image (facultative)
                </legend>
                <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
                  {["", ...images].map((src) => (
                    <label
                      key={src || "aucune"}
                      className="relative block h-[76px] cursor-pointer overflow-hidden rounded-[10px] bg-coffee/[0.06] has-[:checked]:ring-2 has-[:checked]:ring-brownred"
                    >
                      <input
                        type="radio"
                        name="image"
                        checked={form.image === src}
                        onChange={() => setForm({ ...form, image: src })}
                        className="sr-only"
                      />
                      {src ? (
                        <Image
                          src={src}
                          alt={src.replace("/images/", "")}
                          fill
                          sizes="120px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center text-[11px] font-bold text-coffee">
                          Aucune
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
          </div>

          {erreur && (
            <div
              role="alert"
              className="mt-3.5 rounded-[10px] bg-brownred/10 px-3.5 py-2.5 text-[12.5px] text-brownred"
            >
              {erreur}
            </div>
          )}

          <div className="mt-[22px] flex gap-2.5">
            <button
              type="button"
              disabled={envoi}
              onClick={enregistrer}
              className="min-h-[48px] flex-1 rounded-full bg-sunflower text-[10.5px] font-bold tracking-[0.14em] text-coffee uppercase disabled:opacity-60"
            >
              {envoi ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={() => setForm(null)}
              className="min-h-[48px] rounded-full bg-coffee/[0.07] px-5 text-[10.5px] font-bold tracking-[0.14em] text-coffee uppercase"
            >
              Annuler
            </button>
          </div>
        </Modal>
      )}

      {formCategorie && (
        <Modal onClose={() => setFormCategorie(null)} maxWidth="420px">
          <div className="font-sans text-[9.5px] font-bold tracking-[0.2em] text-taupe uppercase">
            Catégorie
          </div>
          <div className="mt-1.5 font-serif text-[25px]">
            {formCategorie.id ? "Renommer la catégorie" : "Nouvelle catégorie"}
          </div>
          <div className="mt-5">
            <Champ label="Nom de la catégorie">
              <Input
                value={formCategorie.nom}
                onChange={(v) => setFormCategorie({ ...formCategorie, nom: v })}
              />
            </Champ>
          </div>
          {erreur && (
            <div
              role="alert"
              className="mt-3.5 rounded-[10px] bg-brownred/10 px-3.5 py-2.5 text-[12.5px] text-brownred"
            >
              {erreur}
            </div>
          )}
          <div className="mt-[22px] flex gap-2.5">
            <button
              type="button"
              disabled={envoi}
              onClick={enregistrerCategorie}
              className="min-h-[48px] flex-1 rounded-full bg-sunflower text-[10.5px] font-bold tracking-[0.14em] text-coffee uppercase disabled:opacity-60"
            >
              {envoi ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={() => setFormCategorie(null)}
              className="min-h-[48px] rounded-full bg-coffee/[0.07] px-5 text-[10.5px] font-bold tracking-[0.14em] text-coffee uppercase"
            >
              Annuler
            </button>
          </div>
        </Modal>
      )}

      {suppression && (
        <Modal onClose={() => setSuppression(null)} maxWidth="420px">
          <div className="font-serif text-2xl">Supprimer « {suppression.nom} » ?</div>
          <p className="mt-2.5 text-[13.5px] leading-[1.6] text-clay">
            La prestation disparaît du site public. Les Réservations déjà prises la conservent.
          </p>
          <div className="mt-[22px] flex gap-2.5">
            <button
              type="button"
              onClick={confirmerSuppression}
              className="min-h-[48px] flex-1 rounded-full bg-brownred text-[10.5px] font-bold tracking-[0.14em] text-ivory uppercase"
            >
              Supprimer
            </button>
            <button
              type="button"
              onClick={() => setSuppression(null)}
              className="min-h-[48px] rounded-full bg-coffee/[0.07] px-5 text-[10.5px] font-bold tracking-[0.14em] text-coffee uppercase"
            >
              Retour
            </button>
          </div>
        </Modal>
      )}

      {suppressionCategorie && (
        <Modal onClose={() => setSuppressionCategorie(null)} maxWidth="420px">
          <div className="font-serif text-2xl">Supprimer « {suppressionCategorie.nom} » ?</div>
          <p className="mt-2.5 text-[13.5px] leading-[1.6] text-clay">
            La catégorie disparaît du site public. Elle ne peut être supprimée que si elle ne
            contient plus aucun soin.
          </p>
          {erreur && (
            <div
              role="alert"
              className="mt-3.5 rounded-[10px] bg-brownred/10 px-3.5 py-2.5 text-[12.5px] text-brownred"
            >
              {erreur}
            </div>
          )}
          <div className="mt-[22px] flex gap-2.5">
            <button
              type="button"
              disabled={envoi}
              onClick={confirmerSuppressionCategorie}
              className="min-h-[48px] flex-1 rounded-full bg-brownred text-[10.5px] font-bold tracking-[0.14em] text-ivory uppercase disabled:opacity-60"
            >
              Supprimer la catégorie
            </button>
            <button
              type="button"
              onClick={() => setSuppressionCategorie(null)}
              className="min-h-[48px] rounded-full bg-coffee/[0.07] px-5 text-[10.5px] font-bold tracking-[0.14em] text-coffee uppercase"
            >
              Retour
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function BoutonOrdre({
  sens,
  libelle,
  desactive,
  onClick,
}: {
  sens: "haut" | "bas";
  libelle: string;
  desactive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={libelle}
      disabled={desactive}
      onClick={onClick}
      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-coffee/[0.06] text-coffee disabled:opacity-30"
    >
      <span aria-hidden="true">{sens === "haut" ? "↑" : "↓"}</span>
    </button>
  );
}

function Champ({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-sans text-[9.5px] font-bold tracking-[0.2em] text-taupe uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  min,
  step,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  min?: number;
  step?: number;
}) {
  return (
    <input
      type={type}
      min={min}
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-[10px] border border-coffee/[.18] bg-white px-3.5 py-3.5 text-sm text-coffee"
    />
  );
}
