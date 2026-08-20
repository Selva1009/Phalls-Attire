const express = require("express");
const db = require("../db");
const authenticate = require("../utils/auth");
const { requireFields } = require("../utils/validation");

const router = express.Router();

router.use(authenticate);

router.get("/", async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT 
        po.id, po.po_number, po.customer_name, po.customer_company, po.customer_email,
        po.customer_address, po.customer_city, po.customer_state, po.customer_country,
        po.customer_postal_code, po.order_date, po.status, po.total_amount, po.payment_id
      FROM purchase_orders po
      JOIN payments pay ON po.payment_id = pay.id
      WHERE po.customer_id = ? AND pay.status = ?
      ORDER BY po.order_date DESC`,
      [req.user.id, "verified"]
    );

    if (!orders.length) {
      return res.json({ purchaseOrders: [] });
    }

    const orderIds = orders.map((order) => order.id);
    const placeholders = orderIds.map(() => "?").join(",");

    const [items] = await db.query(
      `SELECT 
        po_id,
        product_name,
        product_category,
        product_description,
        vendor_name,
        vendor_company,
        vendor_email,
        quantity,
        unit_price,
        total_price
      FROM purchase_order_items
      WHERE po_id IN (${placeholders})`,
      orderIds
    );

    const itemsByOrder = items.reduce((acc, item) => {
      if (!acc[item.po_id]) acc[item.po_id] = [];
      acc[item.po_id].push({
        product_name: item.product_name,
        category: item.product_category,
        description: item.product_description,
        vendor_name: item.vendor_name,
        vendor_company: item.vendor_company,
        vendor_email: item.vendor_email,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      });
      return acc;
    }, {});

    const formattedOrders = orders.map((order) => ({
      ...order,
      items: itemsByOrder[order.id] || [],
    }));

    res.json({ purchaseOrders: formattedOrders });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ error: "Failed to fetch purchase orders" });
  }
});

router.put("/:orderId/cancel", async (req, res) => {
  const { orderId } = req.params;

  if (!requireFields(res, { orderId })) {
    return;
  }

  try {
    const [rows] = await db.query(
      "SELECT id, status FROM purchase_orders WHERE id = ? AND customer_id = ?",
      [orderId, req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: "Order not found" });
    }

    const status = String(rows[0].status || "").toLowerCase();
    if (["cancelled", "delivered", "completed"].includes(status)) {
      return res.status(409).json({ message: "Order cannot be cancelled" });
    }

    const [updateResult] = await db.query(
      "UPDATE purchase_orders SET status = ? WHERE id = ? AND customer_id = ?",
      ["cancelled", orderId, req.user.id]
    );
    if (!updateResult.affectedRows) {
      return res.status(500).json({ message: "Failed to cancel order" });
    }

    return res.json({ success: true, status: "cancelled" });
  } catch (error) {
    console.error("Cancel order error", { code: error.code, errno: error.errno });
    return res.status(500).json({ message: "Failed to cancel order" });
  }
});

module.exports = router;


