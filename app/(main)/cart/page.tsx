"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ShoppingBag,
  MapPin,
} from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useStoreStore } from "@/store/locationStore";
import { Button } from "@/components/ui/Button";
import { formatPrice, getImageUrl } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";

export default function CartPage() {
  const router = useRouter();
  const { items, updateQty, removeItem, totalItems, totalPrice } =
    useCartStore();
  const { activeStore } = useStoreStore();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-app py-16 md:py-24 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={48} className="text-muted-foreground opacity-50" />
        </div>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-4">
          Your cart is empty
        </h1>
        <p className="text-muted-foreground max-w-md mb-8">
          Looks like you haven't added anything to your cart yet. Browse the
          menu to find something delicious.
        </p>
        <Link href={activeStore ? "/menu" : "/"}>
          <Button size="lg" className="rounded-full px-8">
            {activeStore ? "Browse Menu" : "Select Store"}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container-app py-12 md:py-16">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground">
            Your Cart
          </h1>
          {activeStore && (
            <p className="text-muted-foreground flex items-center gap-1.5 mt-2">
              <MapPin size={14} /> Ordering from:{" "}
              <span className="font-medium text-foreground">
                {activeStore.name}
              </span>
            </p>
          )}
        </div>
        <span className="bg-secondary text-secondary-foreground text-sm font-bold px-3 py-1 rounded-full">
          {totalItems()} Items
        </span>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Cart Items */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div
                key={item.product.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                  transition: { duration: 0.2 },
                }}
                className="bg-card border border-border p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 relative group"
              >
                {/* Product Image */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-xl overflow-hidden shrink-0">
                  <Image
                    src={getImageUrl(item.product.image)}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col gap-1 w-full">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-heading font-bold text-lg text-foreground truncate">
                      {item.product.name}
                    </h3>
                    <span className="font-heading font-bold text-lg text-foreground whitespace-nowrap">
                      {formatPrice(item.product.price * item.qty)}
                    </span>
                  </div>

                  <p className="text-muted-foreground text-sm">
                    {formatPrice(item.product.price)} each
                  </p>

                  <div className="flex items-center justify-between mt-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1 bg-secondary rounded-lg p-1 border border-border">
                      <button
                        onClick={() => updateQty(item.product.id, item.qty - 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-md bg-background border shadow-sm text-foreground hover:bg-muted transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-semibold text-foreground w-8 text-center text-sm">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.product.id, item.qty + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-md bg-background border shadow-sm text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                        disabled={item.qty >= item.product.stock}
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4">
          <div className="bg-card border border-border rounded-2xl p-6 sticky top-24 shadow-sm">
            <h2 className="font-heading text-xl font-bold text-foreground mb-6">
              Order Summary
            </h2>

            <div className="flex flex-col gap-4 text-sm mb-6 border-b border-border pb-6">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal ({totalItems()} items)</span>
                <span className="text-foreground font-medium">
                  {formatPrice(totalPrice())}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Platform Fee</span>
                <span className="text-foreground font-medium">
                  {formatPrice(0)}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-8">
              <span className="font-medium text-foreground">Total to Pay</span>
              <span className="font-heading text-2xl font-bold text-foreground">
                {formatPrice(totalPrice())}
              </span>
            </div>

            <Button
              variant="default"
              size="lg"
              className="w-full rounded-xl"
              onClick={() => router.push("/checkout")}
              rightIcon={<ArrowRight size={18} />}
            >
              Proceed to Checkout
            </Button>

            <p className="text-center text-xs text-muted-foreground mt-4">
              By proceeding, you agree to our terms and conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
