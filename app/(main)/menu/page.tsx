"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ShoppingBag,
  Plus,
  Minus,
  X,
  AlertCircle,
  UtensilsCrossed,
  Coffee,
  Sandwich,
  CupSoda,
  Croissant,
  Cookie,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cartStore";
import { useLocationStore } from "@/store/locationStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { formatPrice, getImageUrl } from "@/lib/utils";
import type { Product, Location } from "@/types";

const CATEGORIES = [
  "All",
  "Noodles",
  "Sandwiches",
  "Egg Items",
  "Beverages",
  "Breakfast",
  "Snacks",
];

const CategoryIcons: Record<string, React.ReactNode> = {
  All: <UtensilsCrossed size={16} />,
  Noodles: <UtensilsCrossed size={16} />,
  Sandwiches: <Sandwich size={16} />,
  "Egg Items": <Coffee size={16} />,
  Beverages: <CupSoda size={16} />,
  Breakfast: <Croissant size={16} />,
  Snacks: <Cookie size={16} />,
};

export function MenuContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initCategory = searchParams.get("category") ?? "All";

  const { activeLocation } = useLocationStore();
  const [liveLocation, setLiveLocation] = useState<Location | null>(
    activeLocation,
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(initCategory);

  const { addItem, items, updateQty, removeItem, totalItems, totalPrice } =
    useCartStore();

  const fetchData = useCallback(async () => {
    if (!activeLocation) {
      router.replace("/");
      return;
    }

    const supabase = createClient();
    const [{ data: prods }, { data: loc }] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("location_id", activeLocation.id)
        .eq("is_active", true)
        .order("category"),
      supabase
        .from("locations")
        .select("*")
        .eq("id", activeLocation.id)
        .single(),
    ]);

    setProducts(prods ?? []);
    if (loc) setLiveLocation(loc);
    setLoading(false);
  }, [activeLocation, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getCartQty = (productId: string) =>
    items.find((i) => i.product.id === productId)?.qty ?? 0;

  const filtered = products.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // If no location, prevent rendering anything until redirect happens
  if (!activeLocation) return null;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="md" />
          <p className="text-muted-foreground font-medium">Loading menu…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-foreground mb-2">
          Our Menu
        </h1>
        <p className="text-muted-foreground font-medium">
          Ordering from {liveLocation?.name}
        </p>
      </div>

      {/* Shop Closed Notice */}
      {liveLocation && !liveLocation.shop_open && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
          <AlertCircle className="text-destructive shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-destructive font-heading font-semibold">
              Shop is Closed
            </p>
            <p className="text-destructive/80 text-sm font-medium mt-0.5">
              {liveLocation.notice ??
                "This location is currently closed. Please check back later."}
            </p>
          </div>
        </div>
      )}

      {/* Notice Banner */}
      {liveLocation?.notice && liveLocation.shop_open && (
        <div className="mb-6 p-3 rounded-xl bg-primary/10 text-primary text-sm font-medium flex items-center gap-2 border border-primary/20">
          <AlertCircle size={16} className="shrink-0" />
          {liveLocation.notice}
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            placeholder="Search menu…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-border rounded-xl pl-10 pr-10 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="sticky top-16 z-30 flex gap-2 overflow-x-auto pb-4 pt-2 mb-6 bg-background/95 backdrop-blur-sm border-b border-border scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0 ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <span>{CategoryIcons[cat]}</span>
            {cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Search size={32} className="text-muted-foreground mx-auto mb-4" />
          <p className="font-heading text-xl font-semibold text-foreground">
            No items found
          </p>
          <p className="text-muted-foreground mt-2">
            Try a different category or search term.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((product, i) => {
              const cartQty = getCartQty(product.id);
              const outOfStock = product.stock === 0;
              const lowStock = product.stock <= 3 && product.stock > 0;

              return (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className={`bg-card border border-border rounded-2xl overflow-hidden flex flex-col h-full shadow-sm hover:shadow-md transition-all ${
                      outOfStock ? "opacity-60" : ""
                    }`}
                  >
                    {/* Product Image */}
                    <div className="relative aspect-[4/3] w-full bg-muted border-b border-border">
                      <Image
                        src={getImageUrl(product.image)}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                      <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                        {outOfStock && (
                          <Badge label="Sold Out" variant="red" size="sm" />
                        )}
                        {lowStock && (
                          <Badge
                            label={`${product.stock} left`}
                            variant="yellow"
                            size="sm"
                          />
                        )}
                      </div>
                      <div className="absolute top-2 left-2">
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm text-foreground text-[10px] font-semibold border border-border">
                          <span className="scale-[0.8]">
                            {CategoryIcons[product.category]}
                          </span>{" "}
                          {product.category}
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 flex flex-col flex-1 gap-4">
                      <div className="flex-1">
                        <h3 className="font-heading text-lg font-bold text-foreground leading-tight">
                          {product.name}
                        </h3>
                        {product.description && (
                          <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-heading text-lg font-bold text-foreground">
                          {formatPrice(product.price)}
                        </span>

                        {/* Add to Cart Controls */}
                        {outOfStock ? (
                          <span className="text-sm font-medium text-muted-foreground">
                            Out of stock
                          </span>
                        ) : cartQty === 0 ? (
                          <Button
                            variant="default"
                            size="sm"
                            leftIcon={<Plus size={14} />}
                            onClick={() => {
                              addItem(product);
                              toast.success(`${product.name} added to cart!`);
                            }}
                            disabled={!liveLocation?.shop_open}
                          >
                            Add
                          </Button>
                        ) : (
                          <div className="flex items-center gap-3 bg-secondary rounded-lg p-1 border border-border">
                            <button
                              onClick={() => {
                                if (cartQty === 1) removeItem(product.id);
                                else updateQty(product.id, cartQty - 1);
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded-md bg-background border shadow-sm text-foreground hover:bg-muted transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="font-semibold text-foreground w-4 text-center text-sm">
                              {cartQty}
                            </span>
                            <button
                              onClick={() => {
                                if (cartQty < product.stock) {
                                  updateQty(product.id, cartQty + 1);
                                } else {
                                  toast.error("Cannot exceed available stock");
                                }
                              }}
                              className="w-7 h-7 flex items-center justify-center rounded-md bg-background border shadow-sm text-foreground hover:bg-muted transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Floating Cart Button (Mobile) */}
      <AnimatePresence>
        {totalItems() > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-40 md:hidden"
          >
            <Link href="/cart">
              <Button
                variant="default"
                size="lg"
                className="rounded-full h-14 px-6 shadow-lg"
                leftIcon={<ShoppingBag size={20} />}
              >
                <div className="flex flex-col items-start ml-2 text-left">
                  <span className="text-xs font-semibold opacity-90">
                    {totalItems()} items
                  </span>
                  <span className="font-heading font-bold">
                    {formatPrice(totalPrice())}
                  </span>
                </div>
              </Button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Spinner size="md" />
        </div>
      }
    >
      <MenuContent />
    </Suspense>
  );
}
