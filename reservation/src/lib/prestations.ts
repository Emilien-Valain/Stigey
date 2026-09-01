// Catalogue de Prestations (glossaire reservation/CONTEXT.md).
// Source unique pour Accueil, Prestations et le tunnel de Réservation.
export type Prestation = {
  id: string;
  nom: string;
  duree: string;
  dureeMinutes: number;
  prix: string;
  accroche: string;
  description: string;
  descriptionMobile?: string;
  pourQui: string;
  badge?: string;
  image: string;
};

export const PRESTATIONS: Prestation[] = [
  {
    id: "diagnostic",
    nom: "Diagnostic du cuir chevelu",
    duree: "1 h",
    dureeMinutes: 60,
    prix: "40 €",
    accroche: "Pour comprendre votre cuir chevelu et votre texture avant tout soin.",
    description:
      "Un temps d'échange, une observation attentive du cuir chevelu et de la fibre, puis les axes de travail et la routine à mettre en place. Le diagnostic est déduit du prix de votre premier soin.",
    descriptionMobile:
      "Un temps d'échange, une observation attentive du cuir chevelu et de la fibre, puis les axes de travail et la routine à mettre en place.",
    pourQui: "un premier rendez-vous, ou une problématique qu'on n'a jamais vraiment élucidée.",
    image: "/images/soin-serum-cuir-chevelu.jpg",
  },
  {
    id: "signature",
    nom: "Head spa signature",
    duree: "1 h 15",
    dureeMinutes: 75,
    prix: "75 €",
    badge: "Le plus demandé",
    accroche:
      "L'expérience complète : détente profonde et rééquilibrage, des cervicales au cuir chevelu.",
    description:
      "Le rituel complet : nettoyage en profondeur, massage du cuir chevelu, des cervicales et des épaules, soin adapté à votre texture et séchage doux. On ne regarde pas l'heure.",
    descriptionMobile:
      "Le rituel complet : nettoyage en profondeur, massage du cuir chevelu, des cervicales et des épaules, soin adapté et séchage doux.",
    pourQui: "envie de relâcher vraiment, tout en faisant du bien à son cuir chevelu.",
    image: "/images/head-spa-bac.jpg",
  },
  {
    id: "apaisant",
    nom: "Soin apaisant — cuir sensible",
    duree: "45 min",
    dureeMinutes: 45,
    prix: "60 €",
    accroche: "Pour les cuirs chevelus réactifs, irrités ou sujets aux démangeaisons.",
    description:
      "Gestes très doux, formules sans parfum et températures maîtrisées pour calmer les inconforts et laisser le cuir chevelu respirer.",
    pourQui: "cuirs chevelus réactifs, tiraillements, démangeaisons.",
    image: "/images/fleur-eau.jpg",
  },
  {
    id: "textures",
    nom: "Soin profond cheveux texturés",
    duree: "1 h 30",
    dureeMinutes: 90,
    prix: "85 €",
    accroche: "Hydratation et nutrition pour boucles, crépus et locks.",
    description:
      "Hydratation intense, nutrition et démêlage patient : un soin pensé pour les boucles, les cheveux crépus et les locks.",
    pourQui: "cheveux secs, poreux, en transition ou en protection.",
    image: "/images/cheveux-textures.jpg",
  },
];

export function getPrestation(id: string): Prestation | undefined {
  return PRESTATIONS.find((p) => p.id === id);
}
