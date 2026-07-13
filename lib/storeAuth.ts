/**
 * lib/storeAuth.ts
 *
 * Server-side helpers for resolving which stores the current user
 * has access to. Called once in the admin layout on mount; results
 * are stored in Zustand (useAdminStore) and NOT re-fetched per page.
 */
import { createClient } from "@/lib/supabase/client";
import type { AdminStoreInfo } from "@/store/adminStore";

/**
 * Returns all stores the currently logged-in user belongs to.
 * Super Admins get ALL stores across the platform.
 * Store Admins get only their own stores.
 */
export async function getUserStores(): Promise<AdminStoreInfo[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Check if Super Admin first
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "SUPER_ADMIN") {
    const { data: stores } = await supabase
      .from("stores")
      .select("id, name, organization_id")
      .order("name");
    return (stores as AdminStoreInfo[]) ?? [];
  }

  // Store Admin — fetch their memberships
  const { data: memberships } = await supabase
    .from("store_members")
    .select("store_id, stores(id, name, organization_id)")
    .eq("profile_id", user.id);

  if (!memberships) return [];

  return memberships
    .map((m) => {
      const s = Array.isArray(m.stores) ? m.stores[0] : m.stores;
      return s as AdminStoreInfo | undefined;
    })
    .filter((s): s is AdminStoreInfo => !!s);
}

/**
 * @deprecated Use useAdminStore().activeStoreId from Zustand instead.
 * Kept for legacy compatibility during migration.
 */
export async function getStoreId(): Promise<string | null> {
  const stores = await getUserStores();
  return stores[0]?.id ?? null;
}

/** Signs the user out and clears the Supabase session. */
export async function clearStoreSession() {
  const supabase = createClient();
  await supabase.auth.signOut();
}
