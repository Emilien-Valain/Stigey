import { getPrestations } from "@/lib/data/prestations";
import PrestationsClient from "./PrestationsClient";

export default async function PrestationsAdminPage() {
  const prestations = await getPrestations();
  return <PrestationsClient prestations={prestations} />;
}
