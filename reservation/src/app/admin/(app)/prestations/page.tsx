import { getCategories, getPrestations } from "@/lib/data/prestations";
import { listerImagesPrestations } from "@/lib/images-prestations";
import PrestationsClient from "./PrestationsClient";

export default async function PrestationsAdminPage() {
  const [categories, prestations, images] = await Promise.all([
    getCategories(),
    getPrestations(),
    listerImagesPrestations(),
  ]);
  return <PrestationsClient categories={categories} prestations={prestations} images={images} />;
}
