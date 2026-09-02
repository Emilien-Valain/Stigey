import { getIndisponibilites } from "@/lib/data/indisponibilites";
import IndisponibilitesClient from "./IndisponibilitesClient";

export default async function IndisponibilitesPage() {
  const indisponibilites = await getIndisponibilites();
  return <IndisponibilitesClient indisponibilites={indisponibilites} />;
}
