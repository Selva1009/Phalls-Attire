const express = require("express");
const db = require("../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { requireFields } = require("../utils/validation");

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

router.put("/product/:id", upload.single("productImage"), async (req, res) => {
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
    if (req.file) {
      if (productImage) fs.unlinkSync(path.join("uploads", productImage));
      productImage = req.file.filename;
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
      return res.status(500).json({ message: "Failed to update product" });
    }

    res.status(200).json({ message: "Product updated successfully!" });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;


