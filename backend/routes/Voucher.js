const express = require("express");
const router = express.Router();
const db = require("../db");
const { body, validationResult } = require("express-validator");

// Get all vouchers (admin/system view)
router.get("/vouchers", async (req, res) => {
  try {
    const [vouchers] = await db.query(
      `SELECT id, code, discount_percent, valid_from, valid_to, is_used, created_at
       FROM vouchers`
    );
    res.json(vouchers);
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Server error fetching vouchers" });
  }
});

// Get valid vouchers for a specific customer user
router.get("/vouchers/customeruser/:customerUserId", async (req, res) => {
  const customerUserId = req.params.customerUserId;

  try {
    const [vouchers] = await db.query(
      `SELECT v.id, v.code, v.discount_percent, v.valid_from, v.valid_to, v.created_at,
              CASE WHEN COUNT(vu.id) > 0 THEN 1 ELSE 0 END AS is_used
       FROM vouchers v
       LEFT JOIN voucher_usage vu
         ON v.id = vu.voucher_id AND vu.customer_user_id = ?
       WHERE NOW() BETWEEN v.valid_from AND v.valid_to
       GROUP BY v.id, v.code, v.discount_percent, v.valid_from, v.valid_to, v.created_at`,
      [customerUserId]
    );

    res.json(vouchers);
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Server error fetching vouchers" });
  }
});

// Apply voucher to a purchase order
router.post(
  "/apply-voucher",
  [
    body("customer_user_id").isInt().withMessage("Invalid customer user ID"),
    body("voucher_code").isString().trim().notEmpty().withMessage("Voucher code is required"),
    body("po_id").isInt().withMessage("Invalid purchase order ID"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customer_user_id, voucher_code, po_id } = req.body;

    try {
      // Validate customer exists
      const [customerResult] = await db.query(
        "SELECT id FROM customerusersignup WHERE id = ?",
        [customer_user_id]
      );
      if (customerResult.length === 0) {
        return res.status(404).json({ message: "Customer user not found" });
      }

      // Get valid voucher by code
      const [voucherResult] = await db.query(
        `SELECT * FROM vouchers
         WHERE code = ? AND NOW() BETWEEN valid_from AND valid_to`,
        [voucher_code]
      );
      if (voucherResult.length === 0) {
        return res.status(400).json({ message: "Invalid or expired voucher" });
      }
      const voucher = voucherResult[0];

      // Check if already used by this customer
      const [usedResult] = await db.query(
        "SELECT * FROM voucher_usage WHERE voucher_id = ? AND customer_user_id = ?",
        [voucher.id, customer_user_id]
      );
      if (usedResult.length > 0) {
        return res.status(400).json({ message: "Voucher already used" });
      }

      // Get PO
      const [poResult] = await db.query(
        "SELECT total_amount FROM purchase_orders WHERE id = ? AND customer_id = ?",
        [po_id, customer_user_id]
      );
      if (poResult.length === 0) {
        return res.status(404).json({ message: "Purchase order not found" });
      }

      const discountAmount = (poResult[0].total_amount * voucher.discount_percent) / 100;
      const newTotal = poResult[0].total_amount - discountAmount;

      const [updateResult] = await db.query(
        `UPDATE purchase_orders
         SET voucher_code = ?, discount_amount = ?, discount_percent = ?, total_amount = ?
         WHERE id = ?`,
        [voucher.code, discountAmount, voucher.discount_percent, newTotal, po_id]
      );
      if (!updateResult.affectedRows) {
        return res.status(500).json({ message: "Failed to apply voucher" });
      }

      const [insertResult] = await db.query(
        "INSERT INTO voucher_usage (voucher_id, customer_user_id, po_id, used_at) VALUES (?, ?, ?, NOW())",
        [voucher.id, customer_user_id, po_id]
      );
      if (!insertResult.affectedRows) {
        return res.status(500).json({ message: "Failed to record voucher usage" });
      }

      res.json({
        message: "Voucher applied successfully",
        discount_percent: voucher.discount_percent,
        discount_amount: discountAmount,
        new_total: newTotal,
      });
    } catch (error) {
      console.error("Server error", { code: error.code, errno: error.errno });
      res.status(500).json({ message: "Server error applying voucher" });
    }
  }
);

// Remove voucher from a purchase order
router.post("/remove-voucher/:po_id", async (req, res) => {
  const po_id = req.params.po_id;

  try {
    const [poResult] = await db.query(
      "SELECT id, voucher_code, discount_amount, total_amount FROM purchase_orders WHERE id = ?",
      [po_id]
    );

    if (poResult.length === 0) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    const po = poResult[0];

    if (!po.voucher_code) {
      return res.status(400).json({ message: "No voucher applied to this order" });
    }

    const originalTotal = (
      parseFloat(po.total_amount) + parseFloat(po.discount_amount)
    ).toFixed(2);

    const [updateResult] = await db.query(
      `UPDATE purchase_orders
       SET voucher_code = NULL, discount_amount = 0, discount_percent = 0, total_amount = ?
       WHERE id = ?`,
      [originalTotal, po_id]
    );
    if (!updateResult.affectedRows) {
      return res.status(500).json({ message: "Failed to remove voucher" });
    }

    const [deleteResult] = await db.query(
      "DELETE FROM voucher_usage WHERE po_id = ?",
      [po_id]
    );
    if (!deleteResult.affectedRows) {
      return res.status(404).json({ message: "Voucher usage not found" });
    }

    res.json({ message: "Voucher removed successfully", original_total: originalTotal });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Server error removing voucher" });
  }
});

module.exports = router;

