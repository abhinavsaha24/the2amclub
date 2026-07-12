"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Save,
  Check,
  Upload,
  Store,
  Info,
  MapPin,
  Banknote,
  HelpCircle,
} from "lucide-react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { getAdminSession } from "@/lib/adminAuth";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import type { Location } from "@/types";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locationId, setLocationId] = useState<string | null>(null);

  const [form, setForm] = useState({
    shop_open: true,
    notice: "",
    upi_id: "",
    pickup_address: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingQrPath, setExistingQrPath] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    const locId = await getAdminSession();
    if (!locId) return;
    setLocationId(locId);

    const supabase = createClient();
    const { data } = await supabase
      .from("locations")
      .select("*")
      .eq("id", locId)
      .single();

    if (data) {
      const loc = data as Location;
      setForm({
        shop_open: loc.shop_open,
        notice: loc.notice || "",
        upi_id: loc.upi_id || "",
        pickup_address: loc.pickup_address || "",
      });
      setExistingQrPath(loc.upi_qr_image);
      setImagePreview(loc.upi_qr_image);
    }
    setLoading(false);
  }, []);

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

  const handleSave = async () => {
    if (!locationId) return;
    setSaving(true);
    const supabase = createClient();

    let qrPath = existingQrPath;

    // Upload new QR if selected
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const filename = `qr-${locationId}-${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("product-images")
        .upload(filename, imageFile, { upsert: true });

      if (uploadErr) {
        toast.error("QR Code upload failed: " + uploadErr.message);
        setSaving(false);
        return;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(uploadData.path);
      qrPath = publicUrl;
    }

    const { error } = await supabase
      .from("locations")
      .update({
        shop_open: form.shop_open,
        notice: form.notice.trim() || null,
        upi_id: form.upi_id.trim() || null,
        upi_qr_image: qrPath,
        pickup_address: form.pickup_address.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", locationId);

    if (error) {
      toast.error("Failed to update settings");
    } else {
      toast.success("Settings updated successfully!");
      if (imageFile && qrPath) {
        setExistingQrPath(qrPath);
        setImageFile(null);
      }
    }
    setSaving(false);
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
            Location Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage operations and payments for your location.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Operations Panel */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-border pb-4 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Store size={20} />
            </div>
            <h2 className="font-heading text-xl font-bold text-foreground">
              Operations
            </h2>
          </div>

          <div className="space-y-4">
            {/* Shop Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-background">
              <div>
                <p className="font-semibold text-foreground">Shop Status</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {form.shop_open ? "Accepting new orders" : "Currently closed"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, shop_open: !form.shop_open })}
                className={`w-14 h-8 rounded-full transition-colors relative shadow-sm ${form.shop_open ? "bg-green-500" : "bg-muted border border-border"}`}
              >
                <span
                  className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-sm ${form.shop_open ? "left-7" : "left-1"}`}
                />
              </button>
            </div>

            {/* Notice */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Info size={16} className="text-muted-foreground" />
                Customer Notice Message
              </label>
              <input
                type="text"
                value={form.notice}
                onChange={(e) => setForm({ ...form, notice: e.target.value })}
                placeholder="e.g. Delivery might be delayed due to rain"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
              />
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
              <textarea
                value={form.pickup_address}
                onChange={(e) =>
                  setForm({ ...form, pickup_address: e.target.value })
                }
                placeholder="e.g. Hostel Counter — Ground Floor"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none h-24 text-foreground"
              />
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
              <input
                type="text"
                value={form.upi_id}
                onChange={(e) => setForm({ ...form, upi_id: e.target.value })}
                placeholder="e.g. 9876543210@ybl"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground font-mono"
              />
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
          className="rounded-full px-8 shadow-sm"
          leftIcon={saving ? <Spinner size="sm" /> : <Save size={18} />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving Changes..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
