import { AccountClient } from "@/components/account-client";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return <AccountClient initialId={id} />;
}
