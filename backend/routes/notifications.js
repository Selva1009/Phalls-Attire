const express = require("express");
const router = express.Router();
const db = require("../db");
const { requireFields } = require("../utils/validation");

const convertToIST = (utcDateString) => {
  return new Date(utcDateString).toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
  });
};

// Get notifications for a vendor user
router.get("/:vendorId", async (req, res) => {
  try {
    const { vendorId } = req.params;

    const [notifications] = await db.execute(
      "SELECT id, message, created_at, status FROM notifications WHERE product_vendor_id = ?",
      [vendorId]
    );

    const formattedNotifications = notifications.map((notif) => ({
      ...notif,
      created_at: convertToIST(notif.created_at),
    }));

    res.json({ notifications: formattedNotifications });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ error: "Server error" });
  }
});

// Notify vendor when customer adds to cart / places order
router.post("/notify-vendor", async (req, res) => {
  try {
    const { Email, cart } = req.body;

    if (!requireFields(res, { Email, cart })) {
      return;
    }
    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Invalid data provided" });
    }

    const [customerResult] = await db.query(
      "SELECT id, personName, Email FROM customerusersignup WHERE Email = ?",
      [Email]
    );

    if (customerResult.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    const customerName = customerResult[0].personName;
    const customer_id = customerResult[0].id;

    const values = [];

    for (const item of cart) {
      if (!item.productId) continue;

      const [productResult] = await db.query(
        "SELECT id, vendor_id, productName FROM products WHERE id = ?",
        [item.productId]
      );

      if (productResult.length === 0) continue;

      const { id: productId, vendor_id: vendorId, productName } = productResult[0];

      if (!vendorId) continue;

      values.push([
        customer_id,
        customerName,
        vendorId,
        productId,
        `Customer ${customerName} wants to buy your product: ${productName} (Qty: ${item.quantity}). Contact: ${Email}`,
      ]);
    }

    if (values.length === 0) {
      return res.status(400).json({ error: "No valid notifications to insert" });
    }

    const [insertResult] = await db.query(
      `INSERT INTO notifications (customer_id, customerName, product_vendor_id, product_id, message) VALUES ?`,
      [values]
    );
    if (!insertResult.affectedRows) {
      return res.status(500).json({ error: "Failed to insert notifications" });
    }

    res.status(200).json({ message: "Vendor notified successfully!" });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ error: "Server error" });
  }
});

// Mark single notification as read
router.put("/read/:id", async (req, res) => {
  const { id } = req.params;

  if (!requireFields(res, { id })) {
    return;
  }

  try {
    const [result] = await db.execute(
      "UPDATE notifications SET status = 'read' WHERE id = ?",
      [id]
    );

    if (result.affectedRows > 0) {
      return res.json({ success: true, message: "Notification marked as read" });
    } else {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Mark all notifications as read for a vendor
router.put("/read-all/:vendorId", async (req, res) => {
  const { vendorId } = req.params;

  if (!requireFields(res, { vendorId })) {
    return;
  }

  try {
    const [updateResult] = await db.execute(
      "UPDATE notifications SET status = 'read' WHERE product_vendor_id = ? AND status = 'unread'",
      [vendorId]
    );
    if (!updateResult.affectedRows) {
      return res.status(404).json({ success: false, message: "No unread notifications" });
    }

    return res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Get detailed notifications for a vendor user (with product and customer info)
router.get("/details/:vendorId", async (req, res) => {
  try {
    const { vendorId } = req.params;

    const [notifications] = await db.execute(
      `SELECT 
        n.id,
        vu.personName,
        vu.Email,
        p.productName,
        cu.personName AS customerName,
        REPLACE(REPLACE(REGEXP_SUBSTR(n.message, '\\(Qty: [0-9]+\\)'), '(Qty: ', ''), ')', '') AS quantity,
        p.price,
        n.created_at,
        n.status
      FROM notifications n
      JOIN products p ON n.product_id = p.id
      JOIN vendorusersignup vu ON n.product_vendor_id = vu.id
      JOIN customerusersignup cu ON n.customer_id = cu.id
      WHERE n.product_vendor_id = ?
      ORDER BY n.created_at DESC`,
      [vendorId]
    );

    const formattedNotifications = notifications.map((notif) => ({
      ...notif,
      created_at: convertToIST(notif.created_at),
    }));

    res.json({ notifications: formattedNotifications });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;

