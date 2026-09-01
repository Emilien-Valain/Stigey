"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/prestations", label: "Les soins" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-coffee/90 backdrop-blur-md">
      <div className="flex items-center justify-between px-5 py-4 md:px-12 md:py-5">
        <Link href="/" className="block transition-opacity duration-200 hover:opacity-80">
          <Image
            src="/images/STIGEY_White.png"
            alt="Stigey"
            width={1938}
            height={460}
            className="h-4 w-auto md:h-4"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`font-sans text-[13px] font-bold tracking-[0.14em] uppercase transition-colors duration-200 ${
                pathname === item.href ? "text-sunflower" : "text-sand hover:text-ivory"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/reservation"
            className="rounded-full bg-sunflower px-6 py-3 font-sans text-[12.5px] font-bold tracking-[0.04em] text-coffee transition-all duration-200 hover:brightness-105 hover:shadow-[0_8px_20px_-8px_rgba(241,191,83,0.7)] active:scale-[0.96]"
          >
            Réserver
          </Link>
        </nav>

        <Link
          href="/reservation"
          className="rounded-full bg-sunflower px-[18px] py-[11px] font-sans text-xs font-bold tracking-[0.04em] text-coffee transition-all duration-200 active:scale-[0.96] md:hidden"
        >
          Réserver
        </Link>
      </div>
    </header>
  );
}
