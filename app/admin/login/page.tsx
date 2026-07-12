"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { setAdminSession } from "@/lib/adminAuth";
import { Button } from "@/components/ui/Button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    try {
      const supabase = createClient();

      // Look up location by admin_code
      const { data, error } = await supabase
        .from("locations")
        .select("id, name")
        .eq("admin_code", code.trim())
        .single();

      if (error || !data) {
        toast.error("Invalid Admin Code");
        setLoading(false);
        return;
      }

      // Valid code, set session via Server Action
      await setAdminSession(data.id);

      toast.success(`Welcome to ${data.name} Admin Portal`);
      router.push("/admin/dashboard");
      router.refresh(); // Refresh to update layout state
    } catch (err) {
      toast.error("An error occurred during login");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card border border-border p-8 rounded-2xl shadow-sm text-center">
        <div className="w-16 h-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <Zap size={32} />
        </div>

        <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
          Location Admin Portal
        </h1>
        <p className="text-muted-foreground mb-8 text-sm">
          Enter your specific location code to access your dashboard.
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4 text-left">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-foreground">
              Admin Code
            </label>
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. HOSTEL-A-123"
              className="bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-1 transition-all w-full font-mono text-center tracking-widest"
              required
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full mt-4"
            disabled={loading}
            rightIcon={<ArrowRight size={16} />}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Access Dashboard"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
