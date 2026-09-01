import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales — Stigey",
};

export default function MentionsLegalesPage() {
  return (
    <main className="bg-ivory px-5 py-16 md:px-12 md:py-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-serif text-[34px] font-normal md:text-5xl">Mentions légales</h1>
        <p className="mt-4 text-[13px] leading-[1.7] text-taupe">
          Cette page sera complétée avec les informations légales de la praticienne (statut,
          numéro SIREN, adresse) avant la mise en ligne du site.
        </p>
        <div className="mt-8 flex flex-col gap-6 text-[14px] leading-[1.7] text-clay">
          <section>
            <h2 className="font-serif text-xl text-coffee">Éditeur du site</h2>
            <p className="mt-1">À compléter — statut, SIREN et adresse de la praticienne.</p>
          </section>
          <section>
            <h2 className="font-serif text-xl text-coffee">Hébergement</h2>
            <p className="mt-1">Vercel Inc. — hébergement de l&apos;application.</p>
          </section>
          <section>
            <h2 className="font-serif text-xl text-coffee">Contact</h2>
            <p className="mt-1">12 rue des Capucins, 69001 Lyon — 06 12 34 56 78.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
