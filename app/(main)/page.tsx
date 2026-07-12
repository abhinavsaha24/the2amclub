import Link from "next/link";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {  } from "@/types";

export const revalidate = 60; // ISR cache for 60 seconds

export default async function HomePage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Fetch all active stores along with their organizations
  const { data: stores, error } = await supabase
    .from("stores")
    .select(`
      *,
      organizations (
        name,
        slug
      )
    `)
    .eq("is_active", true);

  if (error || !stores) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Failed to load platform data.
      </div>
    );
  }

  // Group stores by organization for display
  const orgMap = new Map<string, { orgName: string; stores: any[] }>();
  
  stores.forEach((store) => {
    const org = Array.isArray(store.organizations) ? store.organizations[0] : store.organizations;
    if (!org) return;

    if (!orgMap.has(org.slug)) {
      orgMap.set(org.slug, { orgName: org.name, stores: [] });
    }
    orgMap.get(org.slug)!.stores.push(store);
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto pt-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            Welcome to The 2AM Club
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Select your campus store to start ordering.
          </p>
        </div>

        {Array.from(orgMap.entries()).map(([orgSlug, { orgName, stores }]) => (
          <div key={orgSlug} className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 border-b border-gray-200 dark:border-gray-800 pb-2">
              {orgName}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stores.map((store) => (
                <Link
                  key={store.id}
                  href={`/store/${orgSlug}/${store.slug}`}
                  className="block bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-800 group"
                >
                  <div className="h-32 bg-gray-200 dark:bg-gray-800 relative">
                    {store.banner ? (
                      <img
                        src={store.banner}
                        alt={`${store.name} banner`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-80 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                  <div className="p-6 relative">
                    {store.logo && (
                      <div className="absolute -top-10 left-6 w-16 h-16 bg-white dark:bg-gray-900 rounded-full p-1 shadow-md">
                        <img
                          src={store.logo}
                          alt={`${store.name} logo`}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                    )}
                    <div className={store.logo ? "mt-4" : ""}>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center justify-between">
                        {store.name}
                        {!store.shop_open && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                            Closed
                          </span>
                        )}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
                        {store.pickup_address || "Pickup location not specified"}
                      </p>
                      {store.opening_hours && (
                        <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs">
                          {store.opening_hours} - {store.closing_hours}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
