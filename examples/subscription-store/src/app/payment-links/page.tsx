import { PaymentLinksClient } from "@/components/payment-links-client";

export default async function PaymentLinksPage({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string }>;
}) {
  const params = await searchParams;
  return <PaymentLinksClient initialPreset={params.preset} />;
}
