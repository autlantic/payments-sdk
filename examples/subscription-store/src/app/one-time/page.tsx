import { OneTimeCheckout } from "@/components/one-time-checkout";

export default async function OneTimePage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const params = await searchParams;
  return <OneTimeCheckout focusProductId={params.focus} />;
}
