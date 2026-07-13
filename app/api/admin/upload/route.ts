import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import sharp from "sharp";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const storeId = formData.get("storeId") as string | null;
    const type = formData.get("type") as string | null; // e.g., 'product', 'logo', 'banner'
    const oldPath = formData.get("oldPath") as string | null;

    if (!file || !storeId || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify Authorization: User must be Super Admin or Store Member
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    let isAuthorized = profile?.role === "SUPER_ADMIN";

    if (!isAuthorized) {
      const { data: membership } = await supabase
        .from("store_members")
        .select("id")
        .eq("store_id", storeId)
        .eq("profile_id", user.id)
        .single();
      
      if (membership) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden: Not authorized for this store" }, { status: 403 });
    }

    // Validate File
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type. Must be an image." }, { status: 400 });
    }
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 2MB limit." }, { status: 400 });
    }

    // Process Image with Sharp
    const buffer = Buffer.from(await file.arrayBuffer());
    const optimizedBuffer = await sharp(buffer)
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const serviceRoleClient = createServiceRoleClient();
    const bucket = "product-images";

    // Delete old image if requested
    if (oldPath) {
      const { error: deleteError } = await serviceRoleClient.storage
        .from(bucket)
        .remove([oldPath]);
      
      if (deleteError) {
        console.error("Failed to delete old image:", deleteError);
      }
    }

    // Upload new image
    const newFileName = `${storeId}/${type}/${uuidv4()}.webp`;
    const { error: uploadError } = await serviceRoleClient.storage
      .from(bucket)
      .upload(newFileName, optimizedBuffer, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload Error:", uploadError);
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = serviceRoleClient.storage
      .from(bucket)
      .getPublicUrl(newFileName);

    return NextResponse.json({ success: true, path: newFileName, url: publicUrl });

  } catch (error) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
