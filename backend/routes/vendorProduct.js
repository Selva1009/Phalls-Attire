const express = require("express");
const db = require("../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { requireFields } = require("../utils/validation");
const { UPLOADS_DIR, ensureUploadsDir } = require("../utils/uploads");
const authenticate = require("../utils/auth");
const { requireSuperAdmin } = authenticate;

const router = express.Router();
router.use(authenticate, requireSuperAdmin);

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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ensureUploadsDir());
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage, fileFilter });

router.put("/product/:id", upload.single("productImage"), async (req, res) => {
  if (req.uploadValidationError) {
    return res.status(400).json({ message: req.uploadValidationError });
  }

  try {
    const { price, selling_price, mrp, discount_type, discount_value, description, hsn_code, stock_status, stock, status, subcategory, sizes } = req.body;

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
    if (req.file) {
      if (productImage) fs.unlinkSync(path.join(UPLOADS_DIR, productImage));
      productImage = req.file.filename;
    }

    const basePrice = Number(selling_price ?? price ?? existingProduct[0].selling_price ?? existingProduct[0].price);
    const mrpValue = mrp ?? existingProduct[0].mrp ?? basePrice;
    const discount = Number(discount_value || 0);
    const discountType = String(discount_type ?? existingProduct[0].discount_type ?? "").toLowerCase();
    if (!Number.isFinite(basePrice) || basePrice < 0 || Number(mrpValue) < basePrice || discount < 0 || (discountType === "percentage" && discount > 100) || (discountType === "fixed" && discount > basePrice)) {
      return res.status(400).json({ message: "Invalid product pricing." });
    }
    const finalPrice = Number(Math.max(0, basePrice - (discountType === "percentage" ? basePrice * discount / 100 : discount)).toFixed(2));

    const [updateResult] = await db.execute(
      `UPDATE products
       SET price = ?, mrp = ?, selling_price = ?, discount_type = ?, discount_value = ?,
           final_price = ?, subcategory = ?, stock = ?, sizes = ?, status = ?, description = ?,
           productImage = ?, hsn_code = ?, stock_status = ?
       WHERE id = ?`,
      [
        finalPrice, Number(mrpValue), basePrice, discountType || null, discount,
        finalPrice, subcategory ?? existingProduct[0].subcategory,
        stock === undefined ? existingProduct[0].stock : Number.parseInt(stock, 10),
        sizes ?? existingProduct[0].sizes,
        status ?? existingProduct[0].status,
        description ?? existingProduct[0].description,
        productImage,
        hsn_code ?? existingProduct[0].hsn_code,
        stock_status ?? existingProduct[0].stock_status,
        req.params.id,
      ]
    );
    if (!updateResult.affectedRows) {
      return res.status(500).json({ message: "Failed to update product" });
    }

    res.status(200).json({ message: "Product updated successfully!" });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
