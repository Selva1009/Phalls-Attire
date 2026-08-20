const express = require("express");
const db = require("../db");
const multer = require("multer");
const path = require("path");
const { requireFields } = require("../utils/validation");
const {
  uploadProductImageToSupabase,
  deleteProductImageFromSupabase,
} = require("../utils/supabaseProductImages");

const router = express.Router();

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname || "").toLowerCase();
  if (IMAGE_EXTENSIONS.has(extension) && /^image\//i.test(file.mimetype || "")) {
    return cb(null, true);
  }

  req.uploadValidationError =
    "Only JPG, JPEG, PNG, WEBP, GIF, or AVIF product images are supported.";
  return cb(null, false);
};

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter,
});

router.put("/product/:id", upload.single("productImage"), async (req, res) => {
  if (req.uploadValidationError) {
    return res.status(400).json({ message: req.uploadValidationError });
  }

  let uploadedProductImage = null;
  try {
    const { price, description, hsn_code, stock_status } = req.body;

    if (!requireFields(res, { id: req.params.id })) {
      return;
    }

    const [existingProduct] = await db.query(
      "SELECT * FROM products WHERE id = ?",
      [req.params.id]
    );
    if (existingProduct.length === 0) {
      return res.status(404).json({ message: "Product not found!" });
    }

    let productImage = existingProduct[0].productImage;
    let oldProductImage = null;
    if (req.file) {
      oldProductImage = productImage;
      productImage = await uploadProductImageToSupabase(req.file);
      uploadedProductImage = productImage;
    }

    const [updateResult] = await db.execute(
      `UPDATE products
       SET price = ?, description = ?, productImage = ?, hsn_code = ?, stock_status = ?
       WHERE id = ?`,
      [
        price ?? existingProduct[0].price,
        description ?? existingProduct[0].description,
        productImage,
        hsn_code ?? existingProduct[0].hsn_code,
        stock_status ?? existingProduct[0].stock_status,
        req.params.id,
      ]
    );
    if (!updateResult.affectedRows) {
      await deleteProductImageFromSupabase(uploadedProductImage);
      return res.status(500).json({ message: "Failed to update product" });
    }

    if (oldProductImage) {
      await deleteProductImageFromSupabase(oldProductImage);
    }

    res.status(200).json({ message: "Product updated successfully!" });
  } catch (error) {
    await deleteProductImageFromSupabase(uploadedProductImage);
    console.error("Vendor product update error", {
      code: error.code,
      errno: error.errno,
      message: error.message,
      details: error.details,
    });
    res.status(500).json({
      message: error.message === "Supabase image upload failed."
        ? "Image upload failed."
        : "Internal Server Error",
    });
  }
});

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    const message = error.code === "LIMIT_FILE_SIZE"
      ? "Image file is too large."
      : error.message || "Image upload failed.";
    return res.status(400).json({ message });
  }

  if (error) {
    return res.status(400).json({ message: error.message || "Image upload failed." });
  }

  return next();
});

module.exports = router;
