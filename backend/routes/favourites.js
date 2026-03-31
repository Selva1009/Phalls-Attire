const express = require("express");
const db = require("../db");
const authenticate = require("../utils/auth");
const { requireFields } = require("../utils/validation");

const router = express.Router();

router.use(authenticate);

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        uf.id AS favourite_id,
        uf.created_at AS added_at,
        p.id AS product_id,
        p.productName AS product_name,
        p.category,
        p.description,
        p.price,
        p.productImage AS image_name,
        p.vendor_id,
        v.personName AS vendor_name,
        v.companyName AS vendor_company
      FROM user_favourites uf
      JOIN products p ON p.id = uf.product_id
      LEFT JOIN vendorusersignup v ON v.id = p.vendor_id
      WHERE uf.user_id = ?
      ORDER BY uf.id DESC`,
      [req.user.id]
    );

    const favourites = rows.map((row) => ({
      favourite_id: row.favourite_id,
      added_at: row.added_at,
      product: {
        product_id: row.product_id,
        product_name: row.product_name,
        category: row.category,
        description: row.description,
        price: row.price,
        image_url: row.image_name ? `/uploads/${row.image_name}` : null,
        hsn_code: null,
        stock_status: null,
      },
      vendor: row.vendor_id
        ? {
            vendor_id: row.vendor_id,
            vendor_name: row.vendor_name,
            vendor_company: row.vendor_company,
          }
        : null,
    }));

    res.json({
      success: true,
      count: favourites.length,
      favourites,
    });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", async (req, res) => {
  const { productId } = req.body;
  if (!requireFields(res, { productId })) {
    return;
  }

  try {
    const [existing] = await db.query(
      "SELECT id FROM user_favourites WHERE user_id = ? AND product_id = ?",
      [req.user.id, productId]
    );

    if (existing.length > 0) {
      return res.status(200).json({ success: true });
    }

    const [insertResult] = await db.query(
      "INSERT INTO user_favourites (user_id, product_id, created_at) VALUES (?, ?, NOW())",
      [req.user.id, productId]
    );
    if (!insertResult.affectedRows) {
      return res.status(500).json({ message: "Failed to add favourite" });
    }

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:productId", async (req, res) => {
  const { productId } = req.params;

  if (!requireFields(res, { productId })) {
    return;
  }

  try {
    const [deleteResult] = await db.query(
      "DELETE FROM user_favourites WHERE user_id = ? AND product_id = ?",
      [req.user.id, productId]
    );
    if (!deleteResult.affectedRows) {
      return res.status(404).json({ message: "Favourite not found" });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;


