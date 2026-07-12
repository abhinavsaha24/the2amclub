"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, ArrowRight, Loader2, Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLocationStore } from "@/store/locationStore";
import type { Location } from "@/types";

export default function HomePage() {
  const router = useRouter();
  const { setLocation, activeLocation } = useLocationStore();

  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLocations() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("locations")
          .select("*")
          .order("name");

        if (error) throw error;

        const locs = (data as Location[]) ?? [];
        setLocations(locs);

        // If there's only one location, auto-select it and go to menu
        if (locs.length === 1 && !activeLocation) {
          setLocation(locs[0]);
          router.replace("/menu");
        } else {
          setLoading(false);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load locations");
        setLoading(false);
      }
    }

    fetchLocations();
  }, [router, setLocation, activeLocation]);

  const handleSelectLocation = (loc: Location) => {
    setLocation(loc);
    router.push("/menu");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={32} className="animate-spin text-muted-foreground" />
        <p className="text-muted-foreground font-medium">
          Finding locations near you...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="p-6 rounded-xl bg-destructive/10 text-destructive max-w-md text-center">
          <p className="font-semibold text-lg mb-2">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app py-16 md:py-24">
      <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
        {/* Hero Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6 mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-4">
            <Building2 size={16} />
            <span>Multiple Locations Available</span>
          </div>

          <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground">
            Craving at 2 AM?
            <br />
            <span className="text-muted-foreground">We&apos;ve got you.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto">
            Premium late-night food ordering. Fast, secure, and right on campus.
            Select your hostel or block to get started.
          </p>
        </motion.div>

        {/* Location Picker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="bg-card border shadow-sm rounded-2xl overflow-hidden p-2">
            <div className="px-4 py-3 border-b bg-muted/50 mb-2 rounded-xl">
              <h2 className="font-semibold text-foreground text-left">
                Select your location
              </h2>
            </div>

            <div className="flex flex-col gap-2">
              {locations.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No active locations found right now.
                </div>
              ) : (
                locations.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => handleSelectLocation(loc)}
                    className="flex items-center justify-between w-full p-4 rounded-xl text-left hover:bg-secondary transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background border shadow-sm group-hover:scale-105 transition-transform">
                        <MapPin size={18} className="text-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {loc.name}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {loc.pickup_address}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {!loc.shop_open && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-destructive/10 text-destructive rounded-md">
                          Closed
                        </span>
                      )}
                      <ArrowRight
                        size={18}
                        className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all"
                      />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
