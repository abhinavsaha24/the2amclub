import { createClient } from "@/lib/supabase/client";

export async function getStoreId(): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from("store_members")
    .select("store_id")
    .eq("profile_id", user.id)
    .single();

  return member?.store_id || null;
}

export async function getOrganizationId(): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from("store_members")
    .select("stores(organization_id)")
    .eq("profile_id", user.id)
    .single();

  return (member?.stores as any)?.organization_id || null;
}

export async function clearStoreSession() {
  const supabase = createClient();
  await supabase.auth.signOut();
}
