import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — Stigey",
  description: "Adresse, téléphone, horaires et accès du head spa Stigey, à Angers.",
};

const HORAIRES = [
  { jours: "Mardi — vendredi", heures: "10 h — 19 h" },
  { jours: "Samedi", heures: "9 h — 17 h" },
  { jours: "Dimanche — lundi", heures: "Fermé" },
];

export default function ContactPage() {
  return (
    <main>
      <section className="bg-coffee px-5 pt-8 pb-8 text-center md:grid md:grid-cols-2 md:items-center md:gap-[60px] md:px-12 md:pt-11 md:pb-[66px] md:text-left">
        <div>
          <div className="text-[9.5px] font-bold tracking-[0.26em] text-cottonrose uppercase md:text-[10px] md:tracking-[0.28em]">
            Contact
          </div>
          <h1 className="mt-3 font-serif text-[40px] leading-[1.06] font-normal text-ivory md:mt-[18px] md:text-[70px] md:leading-none">
            On se voit <span className="text-cottonrose italic">bientôt</span> ?
          </h1>
          <p className="mx-auto mt-3.5 max-w-[460px] text-[14.5px] leading-[1.65] text-sand md:hidden">
            La réservation se fait en ligne. Pour toute question avant de venir, écrivez-moi
            — je réponds moi-même.
          </p>
          <p className="mt-[22px] hidden max-w-[460px] text-base leading-[1.75] text-sand md:block">
            La réservation se fait en ligne, 24 h / 24. Pour toute question avant de venir,
            écrivez-moi — je réponds moi-même.
          </p>
          <div className="mt-6 flex flex-col gap-2.5 md:mt-8 md:flex-row md:gap-3.5">
            <Link
              href="/reservation"
              className="rounded-full bg-sunflower px-8 py-[17px] text-center font-sans text-sm font-bold text-coffee transition-all duration-200 hover:brightness-105 hover:shadow-[0_10px_26px_-10px_rgba(241,191,83,0.65)] active:scale-[0.97] md:px-9 md:py-[18px]"
            >
              Réserver un soin
            </Link>
            <a
              href="https://instagram.com/stigey.headspa"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-ivory/35 px-8 py-[15px] text-center font-sans text-xs font-bold tracking-[0.14em] text-ivory no-underline uppercase transition-colors duration-200 hover:border-ivory/60 hover:bg-ivory/10 md:px-[30px] md:py-[17px] md:text-[11px] md:tracking-[0.16em]"
            >
              Écrire sur Instagram
            </a>
          </div>
        </div>
        <div className="relative mt-6 h-[150px] overflow-hidden rounded-[22px] md:mt-0 md:h-[420px] md:rounded-[30px]">
          <Image
            src="/images/pierre-texture.jpg"
            alt="Plan d'accès"
            fill
            sizes="(min-width: 768px) 45vw, 90vw"
            className="object-cover"
            priority
          />
          <span className="absolute bottom-3.5 left-3.5 rounded-full bg-coffee/75 px-[11px] py-[7px] font-sans text-[10px] font-bold tracking-[0.14em] text-ivory uppercase md:bottom-[22px] md:left-[22px] md:px-4 md:py-2.5 md:text-[10px] md:tracking-[0.16em]">
            Plan d&apos;accès · Angers
          </span>
        </div>
      </section>

      <section className="rounded-t-[44px] bg-ivory px-5 py-8 md:rounded-t-[60px] md:px-12 md:py-[60px]">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-5">
          <div className="rounded-[22px] bg-white p-5 md:rounded-[26px] md:p-8">
            <div className="text-[10px] font-bold tracking-[0.18em] text-brownred uppercase">
              Adresse
            </div>
            <p className="mt-2 font-serif text-xl leading-[1.35] md:mt-3 md:text-[26px]">
              Angers
            </p>
            <p className="mt-2 text-[12.5px] leading-[1.6] text-clay md:mt-3 md:text-[13.5px] md:leading-[1.7]">
              Adresse précise communiquée à la confirmation du rendez-vous.
            </p>
          </div>
          <div className="rounded-[22px] bg-white p-5 md:rounded-[26px] md:p-8">
            <div className="text-[10px] font-bold tracking-[0.18em] text-brownred uppercase">
              Téléphone
            </div>
            <p className="mt-2 font-serif text-xl md:mt-3 md:text-[26px]">07 71 14 09 45</p>
            <p className="mt-2 text-[12.5px] text-clay md:hidden">
              Uniquement sur rendez-vous.
            </p>
            <p className="mt-3 hidden text-[13.5px] text-clay md:block">
              Uniquement sur rendez-vous. Si je suis en soin, laissez un message.
            </p>
          </div>
          <div className="rounded-[22px] bg-white p-5 md:rounded-[26px] md:p-8">
            <div className="text-[10px] font-bold tracking-[0.18em] text-brownred uppercase">
              Horaires
            </div>
            <div className="mt-2.5 flex flex-col gap-1.5 text-[13.5px] text-clay md:mt-3.5 md:gap-2 md:text-sm">
              {HORAIRES.map((h) => (
                <div key={h.jours} className="flex justify-between">
                  <span>{h.jours}</span>
                  <span className={h.heures === "Fermé" ? "" : "font-bold text-coffee"}>
                    {h.heures}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
