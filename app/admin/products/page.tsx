"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Upload,
  Check,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getAdminSession } from "@/lib/adminAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
import { formatPrice, getImageUrl } from "@/lib/utils";
import type { Product } from "@/types";
import { ProductSchema } from "@/lib/validators";
import { z } from "zod";

const CATEGORIES = [
  "Noodles",
  "Sandwiches",
  "Egg Items",
  "Beverages",
  "Breakfast",
  "Snacks",
];

type ProductFormData = z.infer<typeof ProductSchema>;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationId, setLocationId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(ProductSchema as any),
    defaultValues: {
      name: "",
      category: "Noodles",
      description: "",
      price: 0,
      stock: 0,
      is_active: true,
    },
  });

  const fetchProducts = useCallback(async () => {
    const locId = await getAdminSession();
    if (!locId) return;
    setLocationId(locId);

    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("location_id", locId)
      .order("category")
      .order("name");

    setProducts((data as Product[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openAdd = () => {
    setEditingProduct(null);
    reset({
      name: "",
      category: "Noodles",
      description: "",
      price: 0,
      stock: 0,
      is_active: true,
    });
    setImageFile(null);
    setImagePreview(null);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    reset({
      name: product.name,
      category: product.category,
      description: product.description ?? "",
      price: product.price,
      stock: product.stock,
      is_active: product.is_active,
    });
    setImageFile(null);
    setImagePreview(product.image ? getImageUrl(product.image) : null);
    setModalOpen(true);
  };

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

  const onSubmit = async (data: ProductFormData) => {
    if (!locationId) return;
    setSaving(true);

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("category", data.category);
    formData.append("price", data.price.toString());
    formData.append("stock", data.stock.toString());
    formData.append("is_active", data.is_active.toString());
    if (data.description) formData.append("description", data.description);
    
    if (imageFile) {
      formData.append("image", imageFile);
    }
    if (editingProduct?.image) {
      formData.append("oldImage", editingProduct.image);
    }
    if (editingProduct) {
      formData.append("id", editingProduct.id);
    }

    try {
      const res = await fetch("/api/v1/admin/products", {
        method: editingProduct ? "PATCH" : "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error?.message || "Something went wrong");
      }

      toast.success(editingProduct ? "Product updated!" : "Product created!");
      setModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (product: Product) => {
    const formData = new FormData();
    formData.append("id", product.id);
    formData.append("name", product.name);
    formData.append("category", product.category);
    formData.append("price", product.price.toString());
    formData.append("stock", product.stock.toString());
    formData.append("is_active", (!product.is_active).toString());
    if (product.description) formData.append("description", product.description);
    // Don't append image to preserve existing

    try {
      const res = await fetch("/api/v1/admin/products", {
        method: "PATCH",
        body: formData,
      });
      if (!res.ok) throw new Error("Toggle failed");
      
      toast.success(`${product.name} ${product.is_active ? "hidden" : "visible"}`);
      fetchProducts();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    const product = products.find(p => p.id === id);
    let url = `/api/v1/admin/products?id=${id}`;
    if (product?.image) {
      url += `&imagePath=${encodeURIComponent(product.image)}`;
    }

    try {
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("Product deleted");
      setDeleteId(null);
      fetchProducts();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Products
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {products.length} items in menu
          </p>
        </div>
        <Button
          variant="default"
          size="md"
          leftIcon={<Plus size={16} />}
          onClick={openAdd}
        >
          Add Product
        </Button>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="xl" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {products.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] bg-muted shrink-0 border-b border-border">
                  <Image
                    src={getImageUrl(product.image)}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 300px"
                  />
                  {!product.is_active && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-background/80 px-2 py-1 rounded-md">
                        Hidden
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col flex-1 gap-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-heading text-sm font-semibold text-foreground">
                        {product.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {product.category}
                      </p>
                    </div>
                    <Badge
                      label={product.stock === 0 ? "Out" : `${product.stock}`}
                      variant={
                        product.stock === 0
                          ? "red"
                          : product.stock <= 5
                            ? "yellow"
                            : "green"
                      }
                      size="sm"
                    />
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-2">
                    <span className="font-heading font-bold text-foreground">
                      {formatPrice(product.price)}
                    </span>
                    <div className="flex items-center gap-1 bg-secondary rounded-lg p-1 border border-border">
                      <button
                        onClick={() => toggleActive(product)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-background transition-all border border-transparent hover:border-border shadow-sm"
                        title={product.is_active ? "Hide" : "Show"}
                      >
                        {product.is_active ? (
                          <ToggleRight size={16} className="text-green-500" />
                        ) : (
                          <ToggleLeft size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => openEdit(product)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-background transition-all border border-transparent hover:border-border shadow-sm"
                        title="Edit"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteId(product.id)}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all border border-transparent hover:border-destructive/20 shadow-sm"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? "Edit Product" : "Add Product"}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Image Upload */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Product Image
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted border border-border shrink-0">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <Upload size={20} />
                  </div>
                )}
              </div>
              <label className="cursor-pointer">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border transition-colors">
                  <Upload size={14} />
                  Upload Image
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Product Name"
                  placeholder="e.g. Butter Maggi"
                  id="product-name"
                />
              )}
            />
            {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Category
            </label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-foreground"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.category && <span className="text-xs text-red-500">{errors.category.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">
              Description
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none h-20 text-foreground"
                  placeholder="Optional description…"
                />
              )}
            />
            {errors.description && <span className="text-xs text-red-500">{errors.description.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Controller
                name="price"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="Price (₹)"
                    type="number"
                    placeholder="0.00"
                    id="product-price"
                    min="0"
                    step="0.50"
                  />
                )}
              />
              {errors.price && <span className="text-xs text-red-500">{errors.price.message}</span>}
            </div>
            <div>
              <Controller
                name="stock"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    label="Stock"
                    type="number"
                    placeholder="0"
                    id="product-stock"
                    min="0"
                  />
                )}
              />
              {errors.stock && <span className="text-xs text-red-500">{errors.stock.message}</span>}
            </div>
          </div>

          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-3 cursor-pointer py-2">
                <button
                  type="button"
                  onClick={() => field.onChange(!field.value)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${field.value ? "bg-primary" : "bg-muted"}`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-primary-foreground transition-all shadow-sm ${field.value ? "left-5" : "left-1"}`}
                  />
                </button>
                <span className="text-sm font-medium text-foreground">
                  {field.value ? "Visible on menu" : "Hidden from menu"}
                </span>
              </label>
            )}
          />

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              size="md"
              fullWidth
              type="button"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="md"
              fullWidth
              type="submit"
              loading={saving}
              leftIcon={<Check size={16} />}
            >
              {editingProduct ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Product"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
            <AlertCircle size={20} className="text-destructive shrink-0" />
            <p className="text-destructive font-medium text-sm">
              This action cannot be undone. The product will be permanently
              deleted.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="md"
              fullWidth
              onClick={() => setDeleteId(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              fullWidth
              leftIcon={<Trash2 size={16} />}
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
