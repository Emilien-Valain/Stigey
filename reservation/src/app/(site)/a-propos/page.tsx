import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "À propos — Stigey",
  description: "Le parcours de la praticienne, sa formation aux soins du cuir chevelu et sa spécialité cheveux texturés, et l'histoire du nom Stigey.",
};

export default function AProposPage() {
  return (
    <main>
      <section className="bg-coffee px-5 pt-8 pb-8 text-center md:grid md:grid-cols-[1fr_380px] md:items-center md:gap-[60px] md:px-12 md:pt-11 md:pb-[66px] md:text-left">
        <div>
          <div className="text-[9.5px] font-bold tracking-[0.26em] text-cottonrose uppercase md:text-[10px] md:tracking-[0.28em]">
            À propos
          </div>
          <h1 className="mt-3 font-serif text-[40px] leading-[1.06] font-normal text-ivory md:mt-[18px] md:text-[70px] md:leading-none">
            Le soin comme un <span className="text-cottonrose italic">savoir</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-[420px] font-serif text-[22px] leading-[1.4] text-[#e0c9bb] md:mx-0 md:mt-7 md:max-w-[520px] md:text-[23px] md:leading-[1.45]">
            « J&apos;ai voulu un lieu où l&apos;on prend le temps de regarder un cuir chevelu
            avant de le traiter. »
          </p>
        </div>
        <div className="relative mx-auto mt-6 h-[300px] w-full max-w-[380px] overflow-hidden rounded-t-[180px] rounded-b-[26px] md:mt-0 md:h-[500px] md:max-w-[380px] md:rounded-t-[260px] md:rounded-b-[30px]">
          <Image
            src="/images/portrait-praticienne.jpg"
            alt="La praticienne Stigey"
            fill
            sizes="(min-width: 768px) 380px, 90vw"
            className="object-cover object-[50%_20%]"
            priority
          />
        </div>
      </section>

      <section className="rounded-t-[44px] bg-ivory px-5 py-8 md:rounded-t-[60px] md:grid md:grid-cols-[1.2fr_1fr] md:gap-[60px] md:px-12 md:py-[60px]">
        <div>
          <p className="text-[14px] leading-[1.7] text-clay md:text-base md:leading-[1.8]">
            Formée aux soins du cuir chevelu et à la spécificité des cheveux texturés,
            j&apos;ai d&apos;abord accompagné des femmes qui, comme moi, n&apos;obtenaient
            jamais de réponse claire à leurs problématiques. Le head spa m&apos;a donné le
            cadre : un temps long, des gestes précis, et une lecture attentive du terrain.
          </p>
          <p className="mt-3.5 text-[14px] leading-[1.7] text-clay md:hidden">
            Je reçois seule, sur rendez-vous, pour ne jamais avoir à écourter un soin.
          </p>
          <p className="mt-[18px] hidden text-base leading-[1.8] text-clay md:block">
            Je reçois seule, sur rendez-vous, pour ne jamais avoir à écourter un soin. Chaque
            rendez-vous se termine par une routine écrite, adaptée à ce que j&apos;ai observé.
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-3 md:mt-0 md:gap-3.5">
          {[
            { label: "Formation", value: "Soins du cuir chevelu & head spa" },
            { label: "Spécialité", value: "Cheveux texturés & cuirs sensibles" },
            { label: "Approche", value: "Diagnostic, soin, routine" },
          ].map((item) => (
            <div key={item.label} className="rounded-[22px] bg-white px-5 py-[18px] md:px-[26px] md:py-[22px]">
              <div className="text-[10px] font-bold tracking-[0.16em] text-brownred uppercase md:tracking-[0.18em]">
                {item.label}
              </div>
              <div className="mt-1.5 font-serif text-[19px] md:mt-2 md:text-[22px]">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ivory px-5 pb-8 md:px-12 md:pb-[70px]">
        <div className="overflow-hidden rounded-[30px] bg-brownred text-ivory md:grid md:grid-cols-[380px_1fr] md:rounded-[40px]">
          <div className="relative h-[210px] md:h-full md:min-h-[360px]">
            <Image
              src="/images/main-cauris.jpg"
              alt="Un cauris tenu dans la main"
              fill
              sizes="(min-width: 768px) 380px, 100vw"
              className="object-cover"
              priority
            />
          </div>
          <div className="p-[22px] md:p-[52px]">
            <div className="text-[9.5px] font-bold tracking-[0.22em] text-cottonrose uppercase md:text-[10px] md:tracking-[0.24em]">
              Le nom
            </div>
            <h2 className="mt-2.5 font-serif text-[27px] leading-[1.1] font-normal text-ivory md:mt-4 md:text-[44px] md:leading-[1.08]">
              Pourquoi Stigey
            </h2>
            <p className="mt-2.5 text-[13.5px] leading-[1.7] text-[#f3d4cf] md:hidden">
              Le cauris, ce petit coquillage, a longtemps valu comme monnaie et comme signe
              de protection en Afrique de l&apos;Ouest. Il dit ce que je crois du soin :
              quelque chose de précieux, qui se transmet.
            </p>
            <p className="mt-[18px] hidden text-[15px] leading-[1.8] text-[#f3d4cf] md:block">
              Le cauris, ce petit coquillage, a longtemps valu comme monnaie et comme signe
              de protection en Afrique de l&apos;Ouest. Il dit ce que je crois du soin :
              quelque chose de précieux, qui se transmet — et qui se mérite du temps.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-ivory px-5 pb-9 md:px-12 md:pb-20">
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-4">
          {[
            ["/images/cocon-bougies.jpg", "Le lieu, ambiance tamisée"],
            ["/images/lumiere-fenetre.jpg", "Lumière de fin de journée"],
            ["/images/fleur-sable.jpg", "Détail végétal"],
            ["/images/produits-jaune.jpg", "Les soins Stigey"],
          ].map(([src, alt]) => (
            <div key={src} className="relative h-[130px] overflow-hidden rounded-[18px] md:h-[230px] md:rounded-[22px]">
              <Image src={src} alt={alt} fill sizes="(min-width: 768px) 23vw, 50vw" className="object-cover" />
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-[11px] tracking-[0.04em] text-taupe md:mt-4 md:text-xs md:tracking-[0.06em]">
          Le lieu, à Angers — quatre places de stationnement à proximité.
        </p>
      </section>
    </main>
  );
}
