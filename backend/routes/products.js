const express = require("express");
const db = require("../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const fsp = require("fs").promises;
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

// Add Product
router.post("/add-product", upload.single("productImage"), async (req, res) => {
  const { vendor_user_id, productName, brand, category, price, description, hsn_code, stock_status } = req.body;
  const productImage = req.file ? req.file.filename : null;

  if (
    !requireFields(res, {
      vendor_user_id,
      productName,
      brand,
      category,
      price,
      description,
    })
  ) {
    return;
  }

  try {
    const [userResult] = await db.query(
      "SELECT companyName FROM vendorusersignup WHERE id = ?",
      [vendor_user_id]
    );

    if (userResult.length === 0) {
      return res.status(404).json({ message: "Vendor user not found." });
    }

    const companyName = userResult[0].companyName;

    const [insertResult] = await db.query(
      `INSERT INTO products (vendor_id, productName, brand, category, price, seller, productImage, description, hsn_code, stock_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [vendor_user_id, productName, brand, category, price, companyName, productImage, description, hsn_code || null, stock_status || null]
    );
    if (!insertResult.affectedRows) {
      return res.status(500).json({ message: "Failed to add product" });
    }

    res.status(201).json({
      message: "Product added successfully",
      productId: insertResult.insertId,
    });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Server error" });
  }
});

// Get All Products
router.get("/get-products/all", async (req, res) => {
  try {
    const [products] = await db.query(
      "SELECT * FROM products WHERE is_deleted = FALSE"
    );
    res.status(200).json({ products });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Server error" });
  }
});

// Get Products by Vendor User ID
router.get("/get-products/:vendorId", async (req, res) => {
  try {
    const [products] = await db.query(
      "SELECT * FROM products WHERE vendor_id = ? AND is_deleted = FALSE",
      [req.params.vendorId]
    );
    res.status(200).json({ products });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Server error" });
  }
});

// Get Product by ID
router.get("/get-product/:id", async (req, res) => {
  try {
    const [product] = await db.query(
      "SELECT * FROM products WHERE id = ?",
      [req.params.id]
    );
    if (product.length === 0) {
      return res.status(404).json({ message: "Product not found!" });
    }
    res.status(200).json({ product: product[0] });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Server error" });
  }
});

// Update Product
router.put("/update-product/:id", upload.single("productImage"), async (req, res) => {
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

// Delete Product (soft delete)
router.delete("/delete-product/:id", async (req, res) => {
  try {
    if (!requireFields(res, { id: req.params.id })) {
      return;
    }

    const [existingProduct] = await db.query(
      "SELECT productImage FROM products WHERE id = ? AND is_deleted = FALSE",
      [req.params.id]
    );

    if (existingProduct.length === 0) {
      return res.status(404).json({ message: "Product not found or already deleted!" });
    }

    const productImage = existingProduct[0].productImage;
    const imagePath = path.join("uploads", productImage);

    if (productImage) {
      try {
        await fsp.access(imagePath);
        await fsp.unlink(imagePath);
      } catch (error) {
        if (error.code !== "ENOENT") {
          console.error("Server error", { code: error.code, errno: error.errno });
          return res.status(500).json({ message: "Error deleting product image." });
        }
      }
    }

    const [updateResult] = await db.execute(
      "UPDATE products SET is_deleted = TRUE WHERE id = ?",
      [req.params.id]
    );
    if (!updateResult.affectedRows) {
      return res.status(500).json({ message: "Failed to delete product" });
    }

    res.status(200).json({ message: "Product deleted successfully!" });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Transfer products from one vendor user to another
router.post("/transfer-products", async (req, res) => {
  const { oldUsername, newUsername } = req.body;

  if (!requireFields(res, { oldUsername, newUsername })) {
    return;
  }

  try {
    const [oldUserRows] = await db.query(
      "SELECT id FROM vendorusersignup WHERE personName = ?",
      [oldUsername.trim()]
    );
    const [newUserRows] = await db.query(
      "SELECT id FROM vendorusersignup WHERE personName = ? AND is_deleted = 0",
      [newUsername.trim()]
    );

    if (oldUserRows.length === 0 || newUserRows.length === 0) {
      return res.status(404).json({ message: "One or both usernames not found" });
    }

    const [updateResult] = await db.query(
      "UPDATE products SET vendor_id = ? WHERE vendor_id = ?",
      [newUserRows[0].id, oldUserRows[0].id]
    );
    if (!updateResult.affectedRows) {
      return res.status(404).json({ message: "No products found to transfer." });
    }

    return res.status(200).json({ message: "Products transferred successfully." });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;


