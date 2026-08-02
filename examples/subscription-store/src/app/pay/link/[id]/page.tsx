import { PayLinkClient } from "@/components/pay-link-client";

export default async function PayLinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PayLinkClient linkId={id} />;
}
