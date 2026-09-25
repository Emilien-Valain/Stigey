import type { Metadata } from "next";
import ReservationFlow from "@/components/ReservationFlow";
import { getCategories, getPrestations } from "@/lib/data/prestations";
import { getJoursOuverts } from "@/lib/actions/reservations-publiques";

export const metadata: Metadata = {
  title: "Réservation — Stigey",
  description: "Réservez votre soin du cuir chevelu chez Stigey : choisissez votre prestation, votre créneau et vos coordonnées.",
};

export default async function ReservationPage() {
  const [categories, prestations, joursOuverts] = await Promise.all([
    getCategories(),
    getPrestations(),
    getJoursOuverts(),
  ]);
  return (
    <main>
      <section className="bg-coffee px-5 pt-8 pb-6 md:px-12 md:pt-11 md:pb-14">
        <div className="text-center md:flex md:items-end md:justify-between md:gap-[50px] md:text-left">
          <div>
            <div className="text-[9.5px] font-bold tracking-[0.26em] text-cottonrose uppercase md:text-[10px] md:tracking-[0.28em]">
              Réservation
            </div>
            <h1 className="mt-3 font-serif text-[38px] leading-[1.06] font-normal text-ivory md:mt-4 md:text-[62px] md:leading-none">
              Réservez votre <span className="text-cottonrose italic">moment</span>.
            </h1>
          </div>
          <p className="mx-auto mt-3.5 hidden max-w-[380px] text-[15px] leading-[1.75] text-sand md:mx-0 md:mt-0 md:block">
            Trois étapes, deux minutes. Vous recevez la confirmation par e-mail, et un rappel
            la veille.
          </p>
        </div>
      </section>

      <div className="rounded-t-[44px] bg-ivory md:rounded-t-[60px]">
        <ReservationFlow categories={categories} prestations={prestations} joursOuverts={joursOuverts} />
      </div>
    </main>
  );
}
