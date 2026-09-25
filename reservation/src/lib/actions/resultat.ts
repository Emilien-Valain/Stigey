// Retour commun des Server Actions du catalogue : rien d'autre que ce dont
// l'UI a besoin (jamais d'enregistrement brut ni d'erreur SQL).
export type ResultatAction = { error?: string };

export const NON_CONNECTEE: ResultatAction = { error: "Votre session a expiré : reconnectez-vous." };
