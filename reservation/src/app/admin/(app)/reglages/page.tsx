import { getBattementMinutes } from "@/lib/data/reglages";
import ReglagesClient from "./ReglagesClient";

export default async function ReglagesPage() {
  const battement = await getBattementMinutes();
  return <ReglagesClient battementInitial={battement} />;
}
