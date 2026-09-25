import Image from "next/image";
import Link from "next/link";
import { getCategories, getPrestations } from "@/lib/data/prestations";
import { grouperParCategorie } from "@/lib/catalogue";

export default async function Home() {
  const [categories, toutes] = await Promise.all([getCategories(), getPrestations()]);
  // Ordre de la praticienne : catégories, puis soins dans chaque catégorie.
  const PRESTATIONS = grouperParCategorie(categories, toutes).flatMap((g) => g.prestations);
  return (
    <main>
      {/* ================= HERO ================= */}
      <section className="bg-coffee px-5 pt-8 pb-14 text-[#f6e3d6] md:grid md:grid-cols-[1fr_650px] md:items-center md:gap-16 md:px-12 md:pt-14 md:pb-20">
        <div className="text-center md:text-left">
          <Image
            src="/images/CAURIS_White.png"
            alt=""
            width={54}
            height={94}
            className="mx-auto h-[54px] w-auto opacity-90 md:mx-0 md:h-[46px]"
          />
          <div className="mt-5 text-[9.5px] font-bold tracking-[0.26em] text-cottonrose uppercase md:mt-6 md:text-[10px] md:tracking-[0.28em]">
            Head spa · cuir chevelu &amp; cheveux texturés
          </div>
          <h1 className="mt-3.5 font-serif text-[45px] leading-[1.04] font-normal text-ivory md:mt-4 md:text-[74px] md:leading-[0.98]">
            Un cocon pour votre <span className="text-cottonrose italic">cuir chevelu</span>.
          </h1>
          <p className="mx-auto mt-4 max-w-[480px] text-[15px] leading-[1.65] text-sand md:hidden">
            Des soins sensoriels et experts, pensés pour votre bien-être, votre texture et la
            santé de votre cuir chevelu.
          </p>
          <p className="mx-auto mt-4 hidden max-w-[480px] text-[15px] leading-[1.65] text-sand md:mx-0 md:block md:text-[17px] md:leading-[1.7]">
            Des soins sensoriels et experts, pensés pour votre bien-être, votre texture et la
            santé de votre cuir chevelu. À Angers, sur rendez-vous, en tête à tête.
          </p>
          <div className="mt-5 flex flex-col items-center gap-3 md:mt-8 md:flex-row">
            <Link
              href="/reservation"
              className="rounded-full bg-cottonrose px-8 py-4 font-sans text-[13.5px] font-bold text-coffee transition-all duration-200 hover:brightness-105 hover:shadow-[0_10px_26px_-10px_rgba(241,191,193,0.65)] active:scale-[0.97] md:px-9 md:py-[18px] md:text-sm"
            >
              Réserver mon moment
            </Link>
            <Link
              href="/prestations"
              className="hidden rounded-full border border-ivory/30 px-[30px] py-4 font-sans text-[11px] font-bold tracking-[0.16em] text-ivory uppercase transition-colors duration-200 hover:border-ivory/60 hover:bg-ivory/10 md:block"
            >
              Les soins
            </Link>
          </div>
          <div className="mt-5 flex justify-center gap-[18px] font-sans text-[9.5px] font-bold tracking-[0.16em] text-[#8a6f5e] uppercase md:mt-10 md:justify-start md:gap-[22px] md:text-[10px]">
            <span>Sur rendez-vous</span>
            <span className="text-sunflower">·</span>
            <span>Angers</span>
            <span className="text-sunflower">·</span>
            <span className="md:hidden">Solo</span>
            <span className="hidden md:inline">Praticienne solo</span>
          </div>
        </div>
        <div className="relative mt-6 h-[280px] overflow-hidden rounded-t-[180px] rounded-b-[26px] md:mt-0 md:h-[520px] md:rounded-t-[280px] md:rounded-b-[30px]">
          <Image
            src="/images/lumiere-chaude.jpg"
            alt="Lumière chaude filtrée à travers le feuillage"
            fill
            sizes="(min-width: 768px) 650px, 90vw"
            className="object-cover"
            priority
          />
        </div>
      </section>

      {/* ================= LES SOINS ================= */}
      <section className="rounded-t-[44px] bg-ivory px-5 py-[34px] md:rounded-t-[60px] md:px-12 md:py-[66px]">
        <div className="flex flex-col items-center text-center md:flex-row md:items-end md:justify-between md:gap-10 md:text-left">
          <div>
            <div className="text-[9.5px] font-bold tracking-[0.24em] text-brownred uppercase md:text-[10px] md:tracking-[0.26em]">
              Les soins
            </div>
            <h2 className="mt-2.5 font-serif text-[33px] leading-[1.1] font-normal md:mt-3 md:text-[48px] md:leading-[1.06]">
              Quatre façons de prendre soin
            </h2>
          </div>
          <Link
            href="/prestations"
            className="mt-5 hidden shrink-0 rounded-full border border-coffee/30 px-7 py-3.5 font-sans text-[11px] font-bold tracking-[0.16em] text-coffee uppercase transition-colors duration-200 hover:border-coffee/60 hover:bg-coffee/5 md:block"
          >
            Voir le détail
          </Link>
        </div>

        <div className="mt-[22px] grid grid-cols-1 gap-[13px] md:mt-[38px] md:grid-cols-4 md:gap-[18px]">
          {PRESTATIONS.map((p) => (
            <div
              key={p.id}
              className={`rounded-[24px] p-[18px] md:rounded-[26px] md:p-[26px] ${
                p.miseEnAvant ? "bg-cottonrose" : "bg-white"
              }`}
            >
              {p.miseEnAvant && (
                <div className="text-[9px] font-bold tracking-[0.2em] text-brownred uppercase">
                  Coup de cœur
                </div>
              )}
              <h3
                className={`font-serif text-[21px] leading-[1.2] font-medium md:text-[23px] ${p.miseEnAvant ? "mt-2" : "mt-0"}`}
              >
                {p.nom}
              </h3>
              <div className="mt-[7px] flex items-center gap-2 font-sans text-[11px] font-bold tracking-[0.14em] text-brownred uppercase">
                <span>{p.duree}</span>
                <span className="h-[3px] w-[3px] rounded-full bg-sunflower" />
                <span>{p.prix}</span>
              </div>
              <p
                className={`mt-2.5 text-[13.5px] leading-[1.6] ${p.miseEnAvant ? "text-[#5c1a18]" : "text-clay"}`}
              >
                {p.accroche}
              </p>
            </div>
          ))}
        </div>

        <Link
          href="/prestations"
          className="mt-4 block rounded-full border border-coffee/[.28] py-3.5 text-center font-sans text-[11px] font-bold tracking-[0.16em] text-coffee uppercase transition-colors duration-200 active:bg-coffee/5 md:hidden"
        >
          Voir tous les soins
        </Link>
      </section>

      {/* ================= CONFIANCE ================= */}
      <section className="bg-ivory px-5 py-[34px] md:px-12 md:py-0 md:pb-[70px]">
        <div className="md:grid md:grid-cols-[380px_1fr] md:items-center md:gap-[50px]">
          <div className="relative hidden h-[400px] overflow-hidden rounded-[30px] md:block">
            <Image
              src="/images/soin-serum-cuir-chevelu.jpg"
              alt="Application ciblée d'un soin"
              fill
              sizes="380px"
              className="object-cover"
            />
          </div>
          <div>
            <div className="text-center md:text-left">
              <Image
                src="/images/CAURIS_Black.png"
                alt=""
                width={32}
                height={56}
                className="mx-auto h-8 w-auto opacity-90 md:mx-0 md:h-[34px]"
              />
              <h2 className="mt-3.5 font-serif text-[31px] leading-[1.1] font-normal md:mt-5 md:text-[46px] md:leading-[1.08]">
                Pourquoi me faire confiance
              </h2>
              <p className="mx-auto mt-1.5 max-w-[420px] text-[13.5px] leading-[1.6] text-clay md:mx-0 md:mt-3.5 md:text-[15px] md:leading-[1.7]">
                La douceur d&apos;un spa, la rigueur d&apos;une expertise.
              </p>
            </div>
            <div className="mt-[22px] flex flex-col gap-3 md:mt-[30px] md:gap-4">
              {[
                {
                  dot: "bg-brownred",
                  titre: "Un vrai temps pour soi",
                  texte:
                    "Lumière tamisée, gestes lents, silence : un cocon pour relâcher complètement.",
                },
                {
                  dot: "bg-sunflower",
                  titre: "Une expertise des textures",
                  texte:
                    "Boucles, crépus, locks : votre texture guide chaque geste et chaque produit.",
                },
                {
                  dot: "bg-cottonrose",
                  titre: "Des conseils sur-mesure",
                  texte:
                    "Des recommandations produits choisies pour vous, à poursuivre chez vous en douceur.",
                },
              ].map((item) => (
                <div key={item.titre} className="flex items-start gap-[18px] rounded-3xl bg-white p-5 md:bg-transparent md:p-0">
                  <span className={`mt-1 h-[10px] w-[10px] shrink-0 rounded-full md:mt-1 md:h-[34px] md:w-[34px] ${item.dot}`} />
                  <div>
                    <div className="font-serif text-[19px] font-medium md:text-[21px]">
                      {item.titre}
                    </div>
                    <p className="mt-1.5 text-[13px] leading-[1.6] text-clay md:mt-1 md:text-[13.5px] md:leading-[1.65]">
                      {item.texte}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= RECOMMANDATIONS ================= */}
      <section className="bg-ivory px-5 pb-[34px] md:px-12 md:pb-[70px]">
        <div className="overflow-hidden rounded-[30px] bg-brownred text-ivory md:grid md:grid-cols-2 md:rounded-[40px]">
          <div className="relative h-[190px] md:order-2 md:h-full md:min-h-[340px]">
            <Image
              src="/images/produits-sable.jpg"
              alt="Les soins recommandés Stigey"
              fill
              sizes="(min-width: 768px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="p-[22px] md:order-1 md:p-[52px]">
            <div className="text-[9.5px] font-bold tracking-[0.22em] text-cottonrose uppercase md:text-[10px] md:tracking-[0.24em]">
              Recommandations
            </div>
            <h2 className="mt-2.5 font-serif text-[27px] leading-[1.1] font-normal text-ivory md:mt-4 md:text-[44px] md:leading-[1.08]">
              Vos produits, choisis pour vous
            </h2>
            <p className="mt-2.5 text-[13.5px] leading-[1.65] text-[#f3d4cf] md:hidden">
              À la fin du soin, je vous indique la routine adaptée à votre cuir chevelu. Un
              conseil donné en soin — jamais une vente.
            </p>
            <p className="mt-[18px] hidden text-[15px] leading-[1.75] text-[#f3d4cf] md:block">
              À la fin du soin, je vous indique la routine adaptée à votre cuir chevelu : ce
              qu&apos;il faut garder, ce qu&apos;il vaut mieux arrêter, et dans quel ordre. Un conseil
              donné en soin — jamais une vente.
            </p>
            <div className="mt-6 hidden gap-[26px] font-sans text-[10px] font-bold tracking-[0.16em] text-cottonrose uppercase md:flex">
              <span>Routine écrite</span>
              <span>·</span>
              <span>Sans obligation d&apos;achat</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= À PROPOS TEASER ================= */}
      <section className="bg-ivory px-5 pb-9 md:px-12 md:pb-20">
        <div className="md:grid md:grid-cols-[1fr_380px] md:items-center md:gap-[50px]">
          <div className="relative h-[230px] overflow-hidden rounded-[30px] md:hidden">
            <Image
              src="/images/portrait-praticienne.jpg"
              alt="La praticienne Stigey"
              fill
              sizes="100vw"
              className="object-cover object-[50%_18%]"
            />
          </div>
          <div className="hidden md:order-2 md:grid md:grid-cols-2 md:grid-rows-2 md:gap-3.5">
            {[
              {
                src: "/images/portrait-praticienne.jpg",
                alt: "La praticienne Stigey",
                position: "object-[50%_18%]",
              },
              { src: "/images/main-cauris.jpg", alt: "Un cauris tenu dans la main", position: "" },
              { src: "/images/cocon-bougies.jpg", alt: "Le lieu", position: "" },
              { src: "/images/plage-rivage.jpg", alt: "Texture de rivage", position: "" },
            ].map((img) => (
              <div key={img.src} className="relative h-[180px] overflow-hidden rounded-[22px]">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="190px"
                  className={`object-cover ${img.position}`}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 md:order-1 md:mt-0">
            <div className="text-[9.5px] font-bold tracking-[0.22em] text-brownred uppercase md:text-[10px] md:tracking-[0.24em]">
              À propos
            </div>
            <h2 className="mt-2.5 font-serif text-[27px] leading-[1.1] font-normal md:mt-4 md:text-[46px] md:leading-[1.08]">
              Un héritage, un savoir-faire
            </h2>
            <p className="mt-2.5 text-[13.5px] leading-[1.65] text-clay md:hidden">
              Stigey — du cauris, coquillage porté par l&apos;héritage guinéen et ouest-africain
              — est né d&apos;une envie simple : prendre soin, vraiment.
            </p>
            <p className="mt-[18px] hidden text-[15px] leading-[1.75] text-clay md:block">
              Stigey — du cauris, coquillage porté par l&apos;héritage guinéen et ouest-africain
              — est né d&apos;une envie simple : prendre soin, vraiment. Je reçois seule, sur
              rendez-vous, pour ne jamais avoir à écourter un soin.
            </p>
            <Link
              href="/a-propos"
              className="mt-4 inline-block rounded-full border border-coffee/[.28] px-[22px] py-3 font-sans text-[10.5px] font-bold tracking-[0.16em] text-coffee uppercase transition-all duration-200 hover:border-coffee/60 hover:bg-coffee/5 active:scale-[0.97] md:mt-7 md:rounded-full md:border-none md:bg-coffee md:px-8 md:py-4 md:text-[11px] md:text-ivory md:hover:bg-coffee/85 md:hover:shadow-[0_10px_26px_-12px_rgba(32,10,9,0.6)]"
            >
              <span className="md:hidden">Mon parcours</span>
              <span className="hidden md:inline">Découvrir mon parcours</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
