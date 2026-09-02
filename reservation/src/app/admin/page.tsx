"use client";

import { useState } from "react";
import { login, demanderLienMdp } from "@/lib/actions/auth";

export default function ConnexionPage() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [lienEnvoye, setLienEnvoye] = useState(false);

  async function doLogin() {
    setEnvoi(true);
    const { error } = await login(email, pwd);
    setEnvoi(false);
    if (error) setErreur(error);
  }

  async function doLienMdp() {
    if (!email.trim()) {
      setErreur("Renseignez votre email pour recevoir un lien.");
      return;
    }
    await demanderLienMdp(email);
    setLienEnvoye(true);
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-coffee px-5 py-16">
      <div className="mx-auto w-full max-w-[360px]">
        <div className="text-center">
          <div className="font-serif text-[34px] tracking-[0.1em] text-ivory">STIGEY</div>
          <div className="mt-2.5 font-sans text-[9px] font-bold tracking-[0.28em] text-cottonrose uppercase">
            Espace praticienne
          </div>
        </div>

        <div className="mt-[34px] rounded-[18px] bg-ivory p-[24px_22px]">
          <h1 className="font-serif text-[22px] font-normal">Connexion</h1>
          <div className="mt-1.5 text-[12.5px] leading-[1.5] text-clay">
            Accès réservé à la praticienne.
          </div>

          <div className="mt-5 flex flex-col gap-3.5">
            <label className="block">
              <span className="mb-1.5 block font-sans text-[9.5px] font-bold tracking-[0.2em] text-taupe uppercase">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErreur("");
                }}
                placeholder="praticienne@stigey.fr"
                className="w-full rounded-[10px] border border-coffee/[.18] bg-white px-3.5 py-3.5 text-sm text-coffee"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block font-sans text-[9.5px] font-bold tracking-[0.2em] text-taupe uppercase">
                Mot de passe
              </span>
              <input
                type="password"
                value={pwd}
                onChange={(e) => {
                  setPwd(e.target.value);
                  setErreur("");
                }}
                placeholder="••••••••"
                onKeyDown={(e) => e.key === "Enter" && doLogin()}
                className="w-full rounded-[10px] border border-coffee/[.18] bg-white px-3.5 py-3.5 text-sm text-coffee"
              />
            </label>
          </div>

          {erreur && (
            <div className="mt-3.5 rounded-[10px] bg-brownred/10 px-3.5 py-2.5 text-[12.5px] text-brownred">
              {erreur}
            </div>
          )}

          <button
            type="button"
            disabled={envoi}
            onClick={doLogin}
            className="mt-[22px] w-full rounded-full bg-sunflower py-[15px] font-sans text-xs font-bold tracking-[0.16em] text-coffee uppercase disabled:opacity-60"
          >
            {envoi ? "Connexion…" : "Se connecter"}
          </button>
          <div className="mt-4 text-center text-[11.5px] text-taupe">
            {lienEnvoye ? (
              "Si un compte existe pour cet email, un lien vient d'être envoyé."
            ) : (
              <>
                Mot de passe oublié ?{" "}
                <button type="button" onClick={doLienMdp} className="text-brownred underline">
                  Recevoir un lien
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
