"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Check,
  Copy,
  ArrowLeft,
  ShieldCheck,
  } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useStoreStore } from "@/store/locationStore";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { formatPrice, getImageUrl } from "@/lib/utils";

type Step = "DETAILS" | "PAYMENT" | "SUCCESS";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const { activeStore } = useStoreStore();

  const [step, setStep] = useState<Step>("DETAILS");
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [utr, setUtr] = useState("");
  const [copied, setCopied] = useState(false);
  const [orderInfo, setOrderInfo] = useState<{ id: string; no: string } | null>(
    null,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if cart is empty or location is missing
  useEffect(() => {
    if (mounted && (items.length === 0 || !activeStore)) {
      router.replace(items.length === 0 ? "/cart" : "/");
    }
  }, [mounted, items.length, activeStore, router]);

  const handleCopyUpi = () => {
    if (!activeStore?.upi_id) return;
    navigator.clipboard.writeText(activeStore.upi_id);
    setCopied(true);
    toast.success("UPI ID copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || phone.length < 10) {
      toast.error("Please enter valid details");
      return;
    }
    setStep("PAYMENT");
  };

  const handleSubmitOrder = async () => {
    if (!utr.trim() || utr.length < 12) {
      toast.error("Please enter a valid 12-digit UTR reference number");
      return;
    }
    if (!activeStore) return;

    setLoading(true);
    try {
      const payload = {
        store_id: activeStore.id,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        utr_reference: utr.trim(),
        items: items.map((i) => ({ product_id: i.product.id, qty: i.qty })),
      };

      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to place order");

      setOrderInfo({ id: data.data.order_id, no: data.data.order_no });
      clearCart();
      setStep("SUCCESS");
      toast.success("Order placed successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || items.length === 0 || !activeStore) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="container-app py-12 md:py-16 max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {/* STEP 1: DETAILS */}
        {step === "DETAILS" && (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-8"
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="font-heading text-3xl font-bold text-foreground">
                Checkout Details
              </h1>
            </div>

            <div className="bg-card border border-border p-6 sm:p-8 rounded-2xl shadow-sm">
              <form
                onSubmit={handleProceedToPayment}
                className="flex flex-col gap-6"
              >
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-foreground">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-foreground">
                    WhatsApp Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      value={phone}
                      onChange={(e) =>
                        setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                      }
                      placeholder="9876543210"
                      className="w-full bg-background border border-border rounded-xl pl-12 pr-4 py-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We need this to notify you when food is ready.
                  </p>
                </div>

                <div className="pt-4 mt-2 border-t border-border flex items-center justify-between">
                  <span className="font-medium text-foreground">
                    Total to Pay
                  </span>
                  <span className="font-heading text-2xl font-bold">
                    {formatPrice(totalPrice())}
                  </span>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full mt-2 rounded-xl"
                >
                  Proceed to Payment
                </Button>
              </form>
            </div>
          </motion.div>
        )}

        {/* STEP 2: PAYMENT */}
        {step === "PAYMENT" && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-8"
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => setStep("DETAILS")}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="font-heading text-3xl font-bold text-foreground">
                Make Payment
              </h1>
            </div>

            <div className="bg-card border border-border p-6 sm:p-8 rounded-2xl shadow-sm text-center flex flex-col items-center">
              <div className="bg-secondary text-primary px-4 py-1.5 rounded-full text-sm font-bold tracking-widest mb-6 inline-flex items-center gap-2">
                <ShieldCheck size={16} /> 100% SECURE
              </div>

              <p className="text-muted-foreground mb-2">
                Scan with any UPI app
              </p>
              <div className="font-heading text-4xl font-bold text-foreground mb-8">
                {formatPrice(totalPrice())}
              </div>

              {/* QR Code */}
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 bg-white p-4 rounded-2xl mx-auto shadow-md mb-6 border border-border">
                {activeStore?.qr_code ? (
                  <Image
                    src={getImageUrl(activeStore.qr_code)}
                    alt="UPI QR Code"
                    fill
                    className="object-contain p-2"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm text-center">
                    QR Not Set
                  </div>
                )}
              </div>

              {/* UPI ID */}
              <div className="w-full max-w-sm mx-auto mb-8">
                <p className="text-sm font-semibold text-foreground mb-2">
                  Or pay to this UPI ID:
                </p>
                <div className="flex items-center bg-secondary rounded-xl p-1 border border-border">
                  <div className="flex-1 px-3 text-sm font-medium truncate">
                    {activeStore?.upi_id || "Not Available"}
                  </div>
                  <button
                    onClick={handleCopyUpi}
                    className="p-2.5 rounded-lg bg-background text-foreground hover:bg-muted transition-colors border border-border shadow-sm"
                  >
                    {copied ? (
                      <Check size={16} className="text-primary" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* UTR Input */}
              <div className="w-full max-w-sm mx-auto border-t border-border pt-8 mt-2">
                <h3 className="font-heading text-lg font-bold text-foreground mb-4">
                  Payment Completed?
                </h3>
                <p className="text-sm text-muted-foreground mb-4 text-left">
                  Enter the 12-digit UTR/Reference number from your payment app
                  to confirm your order.
                </p>
                <input
                  type="text"
                  placeholder="e.g. 312345678901"
                  value={utr}
                  onChange={(e) =>
                    setUtr(e.target.value.replace(/\D/g, "").slice(0, 12))
                  }
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 mb-4 outline-none focus:border-primary focus:ring-1 text-center font-mono tracking-widest transition-all"
                />

                <Button
                  size="lg"
                  className="w-full rounded-xl"
                  onClick={handleSubmitOrder}
                  disabled={loading || utr.length < 12}
                >
                  {loading ? <Spinner size="sm" className="mr-2" /> : null}
                  {loading ? "Verifying..." : "Confirm Order"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === "SUCCESS" && orderInfo && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center py-8"
          >
            <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6">
              <Check size={40} className="stroke-[3]" />
            </div>

            <h1 className="font-heading text-4xl font-bold text-foreground mb-4">
              Order Confirmed!
            </h1>

            <p className="text-muted-foreground mb-8 max-w-md">
              We've received your order and are verifying the payment. Keep this
              screen open or take a screenshot.
            </p>

            <div className="bg-card border border-border rounded-2xl p-8 w-full max-w-sm shadow-sm mb-8">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                Your Order Number
              </p>
              <p className="font-heading text-5xl font-black text-primary tracking-tight">
                {orderInfo.no}
              </p>
              <div className="mt-6 pt-6 border-t border-border text-sm flex flex-col gap-2 text-left text-muted-foreground">
                <p className="flex justify-between">
                  <span>Name:</span>{" "}
                  <span className="text-foreground font-medium">{name}</span>
                </p>
                <p className="flex justify-between">
                  <span>Store:</span>{" "}
                  <span className="text-foreground font-medium">
                    {activeStore?.name}
                  </span>
                </p>
                <p className="flex justify-between">
                  <span>Pickup:</span>{" "}
                  <span className="text-foreground font-medium text-right line-clamp-2">
                    {activeStore?.pickup_address}
                  </span>
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-8"
              onClick={() => router.push("/")}
            >
              Back to Home
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
