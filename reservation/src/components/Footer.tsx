import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-brownred px-5 pt-9 pb-10 text-[#f6e3d6] md:px-12 md:pt-14 md:pb-11">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 text-center md:grid md:grid-cols-3 md:items-start md:gap-12 md:text-left">
        <div className="flex flex-col items-center md:items-start">
          <Image
            src="/images/STIGEY_White.png"
            alt="Stigey"
            width={1938}
            height={460}
            className="h-[42px] w-auto opacity-95 md:h-[52px]"
          />
          <p className="mt-4 text-[13px] leading-[1.8] text-[#f3d4cf] md:mt-5">
            Head spa · soin du cuir chevelu
            <br className="hidden md:block" /> et des cheveux texturés, à Angers.
          </p>
        </div>

        <div>
          <div className="text-[10px] font-bold tracking-[0.2em] text-cottonrose uppercase">
            Contact
          </div>
          <p className="mt-3 text-[13.5px] leading-[1.9] text-[#f3d4cf]">
            Angers
            <br />
            07 71 14 09 45
          </p>
          <a
            href="https://www.instagram.com/stigey1/"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-[13.5px] font-bold text-sunflower no-underline transition-colors duration-200 hover:text-ivory"
          >
            Instagram → @stigey1
          </a>
        </div>

        <div>
          <div className="text-[10px] font-bold tracking-[0.2em] text-cottonrose uppercase">
            Le site
          </div>
          <div className="mt-3 flex flex-col items-center gap-2 md:items-start">
            <Link
              href="/prestations"
              className="text-[13.5px] text-[#f3d4cf] transition-colors duration-200 hover:text-ivory"
            >
              Les soins
            </Link>
            <Link
              href="/a-propos"
              className="text-[13.5px] text-[#f3d4cf] transition-colors duration-200 hover:text-ivory"
            >
              À propos
            </Link>
            <Link
              href="/contact"
              className="text-[13.5px] text-[#f3d4cf] transition-colors duration-200 hover:text-ivory"
            >
              Contact
            </Link>
            <Link
              href="/reservation"
              className="text-[13.5px] text-[#f3d4cf] transition-colors duration-200 hover:text-ivory"
            >
              Réserver
            </Link>
            <Link
              href="/mentions-legales"
              className="text-[13.5px] text-[#f3d4cf] transition-colors duration-200 hover:text-ivory"
            >
              Mentions légales
            </Link>
            <Link
              href="/confidentialite"
              className="text-[13.5px] text-[#f3d4cf] transition-colors duration-200 hover:text-ivory"
            >
              Politique de confidentialité
            </Link>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-9 max-w-5xl border-t border-ivory/20 pt-5 text-center text-[11.5px] text-[#e2b4b0] md:mt-11 md:text-left">
        © {new Date().getFullYear()} Stigey — Tous droits réservés.
      </div>
    </footer>
  );
}
