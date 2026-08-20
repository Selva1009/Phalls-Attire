const path = require("path");
const { v4: uuidv4 } = require("uuid");
const supabase = require("../supabase");

const PRODUCT_IMAGES_BUCKET = "phalls-images";
const PRODUCT_IMAGES_PREFIX = "products";

const uploadProductImageToSupabase = async (file) => {
  if (!file?.buffer) {
    throw new Error("Image file buffer is missing.");
  }

  const extension = path.extname(file.originalname || "").toLowerCase();
  const uniqueFileName = `${uuidv4()}${extension}`;
  const filePath = `${PRODUCT_IMAGES_PREFIX}/${Date.now()}-${uniqueFileName}`;

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    const uploadError = new Error("Supabase image upload failed.");
    uploadError.code = error.statusCode || error.status || error.code;
    uploadError.details = {
      bucket: PRODUCT_IMAGES_BUCKET,
      path: filePath,
      message: error.message,
    };
    uploadError.cause = error;
    throw uploadError;
  }

  const { data } = supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
};

const getSupabaseProductImagePath = (imageUrl) => {
  if (!imageUrl || !/^https?:\/\//i.test(imageUrl)) return null;

  try {
    const url = new URL(imageUrl);
    const marker = `/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/`;
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex === -1) return null;

    const filePath = decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
    return filePath.startsWith(`${PRODUCT_IMAGES_PREFIX}/`) ? filePath : null;
  } catch (error) {
    return null;
  }
};

const deleteProductImageFromSupabase = async (imageUrl) => {
  const filePath = getSupabaseProductImagePath(imageUrl);
  if (!filePath) return;

  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove([filePath]);

  if (error) {
    console.error("Supabase image delete error", { message: error.message });
  }
};

module.exports = {
  uploadProductImageToSupabase,
  deleteProductImageFromSupabase,
};
