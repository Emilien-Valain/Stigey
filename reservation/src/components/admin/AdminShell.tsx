"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";

const NAV = [
  { href: "/admin/aujourdhui", label: "Aujourd'hui" },
  { href: "/admin/reservations", label: "Réservations" },
  { href: "/admin/prestations", label: "Prestations" },
  { href: "/admin/disponibilites", label: "Disponibilités récurrentes" },
  { href: "/admin/indisponibilites", label: "Indisponibilités" },
  { href: "/admin/reglages", label: "Réglages" },
];

function NavList({
  pathname,
  nbAQualifier,
  onNavigate,
}: {
  pathname: string;
  nbAQualifier: number;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col gap-[3px]">
      {NAV.map((n) => {
        const active = pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onNavigate}
            className={`flex items-center justify-between gap-2 rounded-[10px] px-3 py-3 font-sans text-[10px] font-bold tracking-[0.15em] uppercase ${
              active ? "bg-sunflower text-coffee" : "text-latte hover:bg-ivory/10"
            }`}
          >
            <span>{n.label}</span>
            {n.href === "/admin/aujourdhui" && nbAQualifier > 0 && (
              <span className="inline-flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-sunflower px-[5px] text-[10px] text-coffee">
                {nbAQualifier}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

export default function AdminShell({
  nom,
  nbAQualifier,
  children,
}: {
  nom: string;
  nbAQualifier: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);
  const titre = NAV.find((n) => pathname.startsWith(n.href))?.label ?? "";

  return (
    <div className="flex min-h-screen items-stretch bg-ivory">
      {/* Sidebar desktop */}
      <div className="hidden w-[246px] flex-none flex-col bg-coffee p-[18px] md:flex">
        <div className="px-2 font-serif text-xl tracking-[0.12em] text-ivory">STIGEY</div>
        <div className="mt-2 px-2 font-sans text-[8.5px] font-bold tracking-[0.24em] text-taupe uppercase">
          Espace praticienne
        </div>
        <div className="mt-[30px]">
          <NavList pathname={pathname} nbAQualifier={nbAQualifier} />
        </div>
        <div className="mt-auto border-t border-ivory/10 pt-6">
          <div className="text-xs text-latte">{nom}</div>
          <div className="mt-0.5 text-[10px] text-taupe">Praticienne</div>
          <button
            type="button"
            onClick={() => logout()}
            className="mt-3 rounded-full border border-ivory/20 px-3.5 py-2 font-sans text-[9.5px] font-bold tracking-[0.16em] text-cottonrose uppercase"
          >
            Déconnexion
          </button>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar mobile */}
        <div className="sticky top-0 z-30 flex items-center justify-between bg-coffee px-4 py-3.5 md:hidden">
          <div>
            <div className="font-serif text-base tracking-[0.1em] text-ivory">STIGEY</div>
            <div className="mt-0.5 font-sans text-[8px] font-bold tracking-[0.2em] text-taupe uppercase">
              {titre}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNavOpen((v) => !v)}
            aria-label="Menu"
            className="flex h-10 w-10 flex-col items-center justify-center gap-1 rounded-[10px] border border-ivory/20 bg-ivory/10"
          >
            <span className="block h-[1.5px] w-4 bg-ivory" />
            <span className="block h-[1.5px] w-4 bg-ivory" />
            <span className="block h-[1.5px] w-4 bg-ivory" />
          </button>
        </div>
        {navOpen && (
          <div className="flex flex-col gap-[3px] bg-coffee px-3 pt-1.5 pb-[18px] md:hidden">
            <NavList
              pathname={pathname}
              nbAQualifier={nbAQualifier}
              onNavigate={() => setNavOpen(false)}
            />
            <button
              type="button"
              onClick={() => logout()}
              className="mt-2 rounded-[10px] border border-ivory/20 px-3 py-3.5 text-left font-sans text-[9.5px] font-bold tracking-[0.16em] text-cottonrose uppercase"
            >
              Déconnexion
            </button>
          </div>
        )}

        <div className="flex-1 px-4 pt-[18px] pb-[34px] md:px-[34px] md:pt-[30px] md:pb-10">
          {children}
        </div>
      </div>
    </div>
  );
}
