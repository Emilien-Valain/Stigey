// Reprend la logique chip() du design importé : la couleur suit le libellé
// affiché (qui peut différer du statut brut — ex. "À venir" pour une
// Réservation confirmée qui n'a pas encore eu lieu).
export function statusColors(label: string): { bg: string; fg: string } {
  if (label === "Honorée") return { bg: "bg-sunflower", fg: "text-coffee" };
  if (label === "No-show") return { bg: "bg-brownred", fg: "text-ivory" };
  if (label === "Annulée") return { bg: "bg-taupe/20", fg: "text-clay" };
  return { bg: "bg-coffee/[0.07]", fg: "text-coffee" };
}

export default function StatusChip({ label }: { label: string }) {
  const { bg, fg } = statusColors(label);
  return (
    <span
      className={`inline-block rounded-full px-[11px] py-[5px] text-[9.5px] font-bold tracking-[0.14em] whitespace-nowrap uppercase ${bg} ${fg}`}
    >
      {label}
    </span>
  );
}
