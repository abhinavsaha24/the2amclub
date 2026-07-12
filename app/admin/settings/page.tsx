"use client";
import { getStoreId } from "@/lib/storeAuth";

import { useEffect, useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Save,
  Upload,
  Store as StoreIcon,
  Info,
  MapPin,
  Banknote,
  HelpCircle,
} from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import type { Store } from "@/types";
import { UpdateStoreValidator } from "@/lib/validators";
import { z } from "zod";
import { getImageUrl } from "@/lib/utils";

type SettingsFormData = z.infer<typeof UpdateStoreValidator>;

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locationId, setStoreId] = useState<string | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingQrPath, setExistingQrPath] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(UpdateStoreValidator as any),
    defaultValues: {
      shop_open: true,
      notice: "",
      upi_id: "",
      pickup_address: "",
    },
  });

  const fetchSettings = useCallback(async () => {
    const storeId = await getStoreId();
    if (!storeId) return;
    setStoreId(storeId);

    const supabase = createClient();
    const { data } = await supabase
      .from("stores")
      .select("*")
      .eq("id", storeId)
      .single();

    if (data) {
      const loc = data as Store;
      reset({
        shop_open: loc.shop_open,
        notice: loc.notice || "",
        upi_id: loc.upi_id || "",
        pickup_address: loc.pickup_address || "",
      });
      setExistingQrPath(loc.qr_code);
      setImagePreview(loc.qr_code ? getImageUrl(loc.qr_code) : null);
    }
    setLoading(false);
  }, [reset]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data: SettingsFormData) => {
    if (!locationId) return;
    setSaving(true);

    const formData = new FormData();
    formData.append("shop_open", String(data.shop_open ?? false.toString()));
    if (data.notice) formData.append("notice", data.notice);
    if (data.upi_id) formData.append("upi_id", data.upi_id);
    if (data.pickup_address) formData.append("pickup_address", data.pickup_address);

    if (imageFile) {
      formData.append("qr_image", imageFile);
    }
    if (existingQrPath) {
      formData.append("old_qr_path", existingQrPath);
    }

    try {
      const res = await fetch("/api/v1/admin/settings", {
        method: "PUT",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error?.message || "Failed to update settings");
      }

      toast.success("Settings updated successfully!");
      if (result.data?.qr_code) {
        setExistingQrPath(result.data.qr_code);
      }
      setImageFile(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Store Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage operations and payments for your location.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Operations Panel */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <StoreIcon size={20} />
              </div>
              <h2 className="font-heading text-xl font-bold text-foreground">
                Operations
              </h2>
            </div>

            <div className="space-y-4">
              {/* Shop Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-background">
                <Controller
                  name="shop_open"
                  control={control}
                  render={({ field }) => (
                    <>
                      <div>
                        <p className="font-semibold text-foreground">Shop Status</p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {field.value ? "Accepting new orders" : "Currently closed"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => field.onChange(!field.value)}
                        className={`w-14 h-8 rounded-full transition-colors relative shadow-sm ${field.value ? "bg-green-500" : "bg-muted border border-border"}`}
                      >
                        <span
                          className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-sm ${field.value ? "left-7" : "left-1"}`}
                        />
                      </button>
                    </>
                  )}
                />
              </div>

              {/* Notice */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Info size={16} className="text-muted-foreground" />
                  Customer Notice Message
                </label>
                <Controller
                  name="notice"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      value={field.value ?? ""}
                      type="text"
                      placeholder="e.g. Delivery might be delayed due to rain"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                    />
                  )}
                />
                {errors.notice && <p className="text-xs text-red-500">{errors.notice.message}</p>}
                <p className="text-xs text-muted-foreground">
                  This message appears at the top of your menu.
                </p>
              </div>

              {/* Pickup Address */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <MapPin size={16} className="text-muted-foreground" />
                  Pickup Address / Instructions
                </label>
                <Controller
                  name="pickup_address"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder="e.g. Hostel Counter — Ground Floor"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none h-24 text-foreground"
                    />
                  )}
                />
                {errors.pickup_address && <p className="text-xs text-red-500">{errors.pickup_address.message}</p>}
              </div>
            </div>
          </div>

          {/* Payment Panel */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
              <div className="p-2 bg-green-500/10 rounded-lg text-green-600 dark:text-green-400">
                <Banknote size={20} />
              </div>
              <h2 className="font-heading text-xl font-bold text-foreground">
                Payment Details
              </h2>
            </div>

            <div className="space-y-6">
              {/* UPI ID */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  UPI ID (VPA)
                </label>
                <Controller
                  name="upi_id"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      value={field.value ?? ""}
                      type="text"
                      placeholder="e.g. 9876543210@ybl"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground font-mono"
                    />
                  )}
                />
                {errors.upi_id && <p className="text-xs text-red-500">{errors.upi_id.message}</p>}
                <p className="text-xs text-muted-foreground">
                  Students can copy this to pay via their UPI app.
                </p>
              </div>

              {/* QR Upload */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground">
                  UPI QR Code Image
                </label>
                <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-border rounded-xl bg-background/50 hover:bg-muted/50 transition-colors">
                  {imagePreview ? (
                    <div className="relative w-40 h-40 bg-white p-2 rounded-xl shadow-sm border border-border">
                      <Image
                        src={imagePreview}
                        alt="QR Code Preview"
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-secondary text-muted-foreground rounded-full flex items-center justify-center">
                      <HelpCircle size={24} />
                    </div>
                  )}

                  <label className="cursor-pointer text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border transition-colors">
                      <Upload size={16} />
                      {imagePreview ? "Change QR Code" : "Upload QR Code"}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-muted-foreground text-center">
                    Take a screenshot of your UPI QR code from GPay, PhonePe, or
                    Paytm and upload it here.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button Floating */}
        <div className="flex justify-end pt-4">
          <Button
            variant="default"
            size="lg"
            type="submit"
            className="rounded-full px-8 shadow-sm"
            leftIcon={saving ? <Spinner size="sm" /> : <Save size={18} />}
            loading={saving}
          >
            {saving ? "Saving Changes..." : "Save Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
