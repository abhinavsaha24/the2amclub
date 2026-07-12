import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function SuperAdminDashboard() {
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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "SUPER_ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <h1 className="text-2xl font-bold">Unauthorized. Super Admin Access Required.</h1>
      </div>
    );
  }

  const { count: orgCount } = await supabase.from("organizations").select("*", { count: "exact", head: true });
  const { count: storeCount } = await supabase.from("stores").select("*", { count: "exact", head: true });

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-4xl font-bold mb-8 tracking-tight">Super Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
          <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Total Organizations</h3>
          <p className="text-4xl font-bold">{orgCount}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
          <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Total Stores</h3>
          <p className="text-4xl font-bold">{storeCount}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
          <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-2">Platform Revenue</h3>
          <p className="text-4xl font-bold">₹0</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl">
        <h2 className="text-2xl font-bold mb-4">Platform Controls</h2>
        <div className="flex gap-4">
          <button className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition">
            Create Organization
          </button>
          <button className="bg-gray-800 text-white px-6 py-3 rounded-lg font-medium border border-gray-700 hover:bg-gray-700 transition">
            Generate Invitation
          </button>
        </div>
      </div>
    </div>
  );
}
