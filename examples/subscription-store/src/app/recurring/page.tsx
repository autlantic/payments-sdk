import { StoreHome } from "@/components/store-home";

export default async function RecurringPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const params = await searchParams;
  return <StoreHome focusPlanId={params.focus} />;
}
