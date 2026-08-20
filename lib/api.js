export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export const getProductImageUrl = (image, cacheKey = "") => {
  const rawImage = String(image || "").trim();
  if (!rawImage) return "";

  if (
    /^https?:\/\//i.test(rawImage) ||
    /^data:image\//i.test(rawImage) ||
    /^blob:/i.test(rawImage)
  ) {
    return rawImage;
  }

  if (rawImage.startsWith("/") && !/^\/?uploads\//i.test(rawImage)) {
    return rawImage;
  }

  const cleanedImage = rawImage
    .replace(/^\/?uploads\//i, "")
    .replace(/^\/+/, "");
  const suffix = cacheKey ? `${cleanedImage.includes("?") ? "&" : "?"}v=${cacheKey}` : "";

  return `${API_BASE_URL}/uploads/${cleanedImage}${suffix}`;
};

export const getProductImageSource = (product, cacheKey = "") =>
  getProductImageUrl(
    product?.productImage ||
      product?.image_url ||
      product?.imageUrl ||
      product?.image_name ||
      product?.image,
    cacheKey
  );
