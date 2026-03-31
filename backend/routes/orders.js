const express = require("express");
const db = require("../db");
const authenticate = require("../utils/auth");

const router = express.Router();

router.use(authenticate);

router.get("/", async (req, res) => {
  try {
    const [orders] = await db.query(
      `SELECT 
        po.id, po.po_number, po.customer_name, po.customer_company, po.customer_email,
        po.customer_address, po.customer_city, po.customer_state, po.customer_country,
        po.customer_postal_code, po.order_date, po.status, po.total_amount,
        GROUP_CONCAT(
          JSON_OBJECT(
            'product_name', poi.product_name,
            'category', poi.product_category,
            'description', poi.product_description,
            'vendor_name', poi.vendor_name,
            'vendor_company', poi.vendor_company,
            'vendor_email', poi.vendor_email,
            'quantity', poi.quantity,
            'unit_price', poi.unit_price,
            'total_price', poi.total_price
          )
        ) AS items
      FROM purchase_orders po
      JOIN purchase_order_items poi ON po.id = poi.po_id
      WHERE po.customer_id = ?
      GROUP BY po.id
      ORDER BY po.order_date DESC`,
      [req.user.id]
    );

    const formattedOrders = orders.map((order) => ({
      ...order,
      items: JSON.parse(`[${order.items}]`),
    }));

    res.json({ purchaseOrders: formattedOrders });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ error: "Failed to fetch purchase orders" });
  }
});

module.exports = router;


