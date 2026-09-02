import { getDisponibilites } from "@/lib/data/disponibilites";
import DisponibilitesClient from "./DisponibilitesClient";

export default async function DisponibilitesPage() {
  const dispos = await getDisponibilites();
  return <DisponibilitesClient dispos={dispos} />;
}
