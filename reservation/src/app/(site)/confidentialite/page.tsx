import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Stigey",
};

export default function ConfidentialitePage() {
  return (
    <main className="bg-ivory px-5 py-16 md:px-12 md:py-24">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-serif text-[34px] font-normal md:text-5xl">
          Politique de confidentialité
        </h1>
        <div className="mt-8 flex flex-col gap-6 text-[14px] leading-[1.7] text-clay">
          <section>
            <h2 className="font-serif text-xl text-coffee">Ce que nous collectons</h2>
            <p className="mt-1">
              La réservation ne collecte que le strict nécessaire pour gérer votre rendez-vous
              : nom, e-mail et, facultativement, téléphone. Aucune information de santé n&apos;est
              demandée en ligne — un besoin de ce type se traite par téléphone, directement
              avec la praticienne.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-xl text-coffee">Hébergement des données</h2>
            <p className="mt-1">
              Les données sont hébergées dans l&apos;Union européenne. L&apos;envoi des e-mails
              de confirmation transite par un prestataire tiers (Resend, société américaine),
              pour le nom et l&apos;e-mail uniquement.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-xl text-coffee">Vos droits</h2>
            <p className="mt-1">
              Vous pouvez demander l&apos;accès, la rectification ou la suppression de vos
              données en contactant la praticienne directement.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
