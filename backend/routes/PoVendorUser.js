const express = require("express");
const db = require("../db");
const router = express.Router();
const { requireFields } = require("../utils/validation");

// Get all POs for a specific vendor user
router.get("/vendor/:vendorId", async (req, res) => {
  const { vendorId } = req.params;

  try {
    const [orders] = await db.query(
      `SELECT 
        po.id, po.po_number, po.customer_name, po.customer_company, po.customer_email,
        po.customer_address, po.customer_city, po.customer_state, po.customer_country,
        po.customer_postal_code, po.ship_to_address, po.ship_to_city, po.ship_to_state,
        po.ship_to_country, po.ship_to_postal_code, po.order_date, po.status, po.total_amount,
        GROUP_CONCAT(
          JSON_OBJECT(
            'product_name', poi.product_name,
            'description', poi.product_description,
            'vendor_name', poi.vendor_name,
            'vendor_company', poi.vendor_company,
            'vendor_email', poi.vendor_email,
            'vendor_address', poi.vendor_address,
            'vendor_city', poi.vendor_city,
            'vendor_state', poi.vendor_state,
            'vendor_country', poi.vendor_country,
            'vendor_postal_code', poi.vendor_postal_code,
            'quantity', poi.quantity,
            'unit_price', poi.unit_price,
            'total_price', poi.total_price,
            'product_id', poi.product_id
          )
        ) AS items
      FROM purchase_orders po
      JOIN purchase_order_items poi ON po.id = poi.po_id
      WHERE poi.vendor_id = ?
      GROUP BY po.id
      ORDER BY po.order_date DESC`,
      [vendorId]
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

// Get all POs for all vendor users belonging to the same company
// (replaces the old vendor route that used vendorsignup)
router.get("/vendor/company/:vendorId", async (req, res) => {
  const { vendorId } = req.params;

  try {
    // Get the company name from vendorusersignup directly
    const [vendor] = await db.query(
      "SELECT companyName FROM vendorusersignup WHERE id = ?",
      [vendorId]
    );

    if (!vendor || vendor.length === 0) {
      return res.status(404).json({ success: false, error: "Vendor not found" });
    }

    const companyName = vendor[0].companyName;

    const [orders] = await db.query(
      `SELECT 
        po.id, po.po_number, po.customer_name, po.customer_company, po.customer_email,
        po.customer_address, po.customer_city, po.customer_state, po.customer_country,
        po.customer_postal_code, po.ship_to_address, po.ship_to_city, po.ship_to_state,
        po.ship_to_country, po.ship_to_postal_code, po.order_date, po.status, po.total_amount,
        GROUP_CONCAT(
          JSON_OBJECT(
            'product_name', poi.product_name,
            'description', poi.product_description,
            'vendor_name', poi.vendor_name,
            'vendor_company', poi.vendor_company,
            'vendor_email', poi.vendor_email,
            'quantity', poi.quantity,
            'unit_price', poi.unit_price,
            'total_price', poi.total_price,
            'product_id', poi.product_id
          )
        ) AS items
      FROM purchase_orders po
      JOIN purchase_order_items poi ON po.id = poi.po_id
      WHERE poi.vendor_company = ?
      GROUP BY po.id
      ORDER BY po.order_date DESC`,
      [companyName]
    );

    const formattedOrders = orders.map((order) => ({
      ...order,
      items: order.items ? JSON.parse(`[${order.items}]`) : [],
    }));

    res.json({ success: true, companyName, purchaseOrders: formattedOrders });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ success: false, error: "Failed to fetch purchase orders" });
  }
});

// Update PO status
router.put("/update/:poId", async (req, res) => {
  const { poId } = req.params;
  const { status } = req.body;

  if (!requireFields(res, { poId, status })) {
    return;
  }

  try {
    const [updateResult] = await db.query(
      "UPDATE purchase_orders SET status = ? WHERE id = ?",
      [status, poId]
    );
    if (!updateResult.affectedRows) {
      return res.status(404).json({ error: "PO not found" });
    }
    res.json({ message: "PO updated successfully" });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ error: "Failed to update PO" });
  }
});

// Generate PDF (vendor copy)
const PDFDocument = require("pdfkit");

router.post("/generate-pdf/:poId", async (req, res) => {
  const { poId } = req.params;

  try {
    const [poDetails] = await db.query(
      `SELECT po.*, poi.*
       FROM purchase_orders po
       JOIN purchase_order_items poi ON po.id = poi.po_id
       WHERE po.id = ?`,
      [poId]
    );

    if (!poDetails.length) {
      return res.status(404).json({ error: "PO not found" });
    }

    const doc = new PDFDocument({ margin: 40, size: "A4", bufferPages: true });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=PO_${poDetails[0].po_number}.pdf`);
    doc.pipe(res);

    // (PDF rendering logic is identical to customer-side — reuse the same helper or duplicate here)
    // For brevity the structure is the same as purchase_orders.js generate-pdf route

    doc.fontSize(14).font("Helvetica-Bold").text(`Purchase Order: ${poDetails[0].po_number}`, 50, 50);
    doc.fontSize(10).font("Helvetica").text(`Customer: ${poDetails[0].customer_name} (${poDetails[0].customer_company})`, 50, 80);
    doc.text(`Order Date: ${new Date(poDetails[0].order_date).toLocaleDateString("en-IN")}`, 50, 95);
    doc.text(`Status: ${poDetails[0].status}`, 50, 110);
    doc.text(`Total Amount: ${poDetails[0].total_amount}`, 50, 125);

    doc.end();
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;


