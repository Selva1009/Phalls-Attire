const express = require("express");
const db = require("../db");
const authenticate = require("../utils/auth");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const { requireFields } = require("../utils/validation");

// Generate PO from cart
router.post("/generate", async (req, res) => {
  const { customerId, productId, quantity, shipToAddress } = req.body;

  if (!requireFields(res, { customerId, productId, quantity })) {
    return;
  }

  try {
    await db.query("START TRANSACTION");

    // Get customer details directly from customerusersignup
    const [customer] = await db.query(
      `SELECT id, personName, companyName, Email
       FROM customerusersignup
       WHERE id = ?`,
      [customerId]
    );

    if (!customer.length) {
      await db.query("ROLLBACK");
      return res.status(404).json({ error: "Customer not found" });
    }

    // Get product and vendor details from vendorusersignup
    const [product] = await db.query(
      `SELECT 
        p.id AS product_id,
        p.productName,
        p.price,
        p.vendor_id,
        p.description,
        p.category,
        v.personName AS vendorName,
        v.companyName AS vendorCompany,
        v.Email AS vendorEmail
       FROM products p
       JOIN vendorusersignup v ON p.vendor_id = v.id
       WHERE p.id = ?`,
      [productId]
    );

    if (!product.length) {
      await db.query("ROLLBACK");
      return res.status(404).json({ error: "Product not found" });
    }

    const productData = product[0];
    const totalAmount = productData.price * quantity;

    const poNumber = `PO-${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}-${uuidv4().slice(0, 4).toUpperCase()}`;

    const [poResult] = await db.query(
      `INSERT INTO purchase_orders 
        (po_number, customer_id, customer_name, customer_company,
         customer_address, customer_city, customer_state, customer_country, customer_postal_code,
         customer_gst_number, customer_company_registrationNo,
         ship_to_address, ship_to_city, ship_to_state, ship_to_country, ship_to_postal_code,
         total_amount, customer_email, delivery_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        poNumber,
        customerId,
        customer[0].personName,
        customer[0].companyName,
        shipToAddress?.address || "N/A",
        shipToAddress?.city || "N/A",
        shipToAddress?.state || "N/A",
        shipToAddress?.country || "N/A",
        shipToAddress?.postalCode || "N/A",
        "N/A", // GST - not stored in customerusersignup
        "N/A", // Reg number - not stored in customerusersignup
        shipToAddress?.address || "N/A",
        shipToAddress?.city || "N/A",
        shipToAddress?.state || "N/A",
        shipToAddress?.country || "N/A",
        shipToAddress?.postalCode || "N/A",
        totalAmount,
        customer[0].Email,
        "Delivery as soon as possible",
      ]
    );
    if (!poResult.affectedRows) {
      await db.query("ROLLBACK");
      return res.status(500).json({ error: "Failed to create purchase order" });
    }

    const poId = poResult.insertId;

    const [itemResult] = await db.query(
      `INSERT INTO purchase_order_items 
        (po_id, product_id, product_name, product_category, product_description,
         vendor_id, vendor_name, vendor_company,
         vendor_address, vendor_city, vendor_state, vendor_country, vendor_postal_code,
         vendor_gst_number, quantity, unit_price, total_price, vendor_email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        poId,
        productData.product_id,
        productData.productName,
        productData.category,
        productData.description,
        productData.vendor_id,
        productData.vendorName,
        productData.vendorCompany,
        "N/A",
        "N/A",
        "N/A",
        "N/A",
        "N/A",
        "N/A",
        quantity,
        productData.price,
        totalAmount,
        productData.vendorEmail,
      ]
    );
    if (!itemResult.affectedRows) {
      await db.query("ROLLBACK");
      return res.status(500).json({ error: "Failed to create purchase order items" });
    }

    await db.query("COMMIT");

    const [poDetails] = await db.query(
      `SELECT po.*, poi.*
       FROM purchase_orders po
       JOIN purchase_order_items poi ON po.id = poi.po_id
       WHERE po.id = ?`,
      [poId]
    );

    res.status(201).json({
      message: "Purchase order generated successfully",
      poId,
      po: {
        header: {
          poNumber: poDetails[0].po_number,
          customerName: poDetails[0].customer_name,
          customerCompany: poDetails[0].customer_company,
          customerEmail: poDetails[0].customer_email,
          orderDate: poDetails[0].order_date,
          totalAmount: poDetails[0].total_amount,
          status: poDetails[0].status || "PENDING",
          deliveryNotes: poDetails[0].delivery_notes,
        },
        items: poDetails.map((item) => ({
          productName: item.product_name,
          category: item.product_category,
          description: item.product_description,
          vendorName: item.vendor_name,
          vendorCompany: item.vendor_company,
          vendorEmail: item.vendor_email,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          totalPrice: item.total_price,
        })),
      },
    });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ error: "Failed to generate purchase order" });
  }
});

// Get all POs for a customer
router.get("/customer/:customerId", authenticate, async (req, res) => {
  const { customerId } = req.params;
  if (Number(customerId) !== Number(req.user.id)) {
    return res.status(403).json({ error: "Forbidden" });
  }

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
      [customerId]
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

// Update ship-to address
router.put("/:poId/ship-to-address", async (req, res) => {
  const { poId } = req.params;
  const { address, city, state, country, postalCode } = req.body;

  if (
    !requireFields(res, {
      poId,
      address,
      city,
      state,
      country,
      postalCode,
    })
  ) {
    return;
  }

  try {
    const [updateResult] = await db.query(
      `UPDATE purchase_orders
       SET ship_to_address = ?, ship_to_city = ?, ship_to_state = ?,
           ship_to_country = ?, ship_to_postal_code = ?
       WHERE id = ?`,
      [address, city, state, country, postalCode, poId]
    );
    if (!updateResult.affectedRows) {
      return res.status(404).json({ error: "Purchase Order not found" });
    }
    res.json({ message: "Ship-to address updated successfully" });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ error: "Failed to update ship-to address" });
  }
});

// Get ship-to address
router.get("/:poId/ship-to-address", async (req, res) => {
  const { poId } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT ship_to_address, ship_to_city, ship_to_state, ship_to_country, ship_to_postal_code
       FROM purchase_orders WHERE id = ?`,
      [poId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Purchase Order not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ error: "Failed to fetch ship-to address" });
  }
});

// Update delivery notes
router.put("/:poId/delivery-notes", async (req, res) => {
  const { poId } = req.params;
  const { deliveryNotes } = req.body;

  if (!requireFields(res, { poId, deliveryNotes })) {
    return;
  }

  try {
    const [updateResult] = await db.query(
      "UPDATE purchase_orders SET delivery_notes = ? WHERE id = ?",
      [deliveryNotes, poId]
    );
    if (!updateResult.affectedRows) {
      return res.status(404).json({ error: "Purchase order not found" });
    }
    res.json({ message: "Delivery notes updated successfully" });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ error: "Failed to update delivery notes" });
  }
});

// Get delivery notes
router.get("/:poId/delivery-notes", async (req, res) => {
  const { poId } = req.params;

  try {
    const [result] = await db.query(
      "SELECT delivery_notes FROM purchase_orders WHERE id = ?",
      [poId]
    );

    if (!result.length) {
      return res.status(404).json({ error: "Purchase order not found" });
    }

    res.json({ deliveryNotes: result[0].delivery_notes });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ error: "Failed to fetch delivery notes" });
  }
});

// Save signature
router.put("/save-signature/:poId", async (req, res) => {
  const { poId } = req.params;
  const { signature } = req.body;

  if (!requireFields(res, { poId, signature })) {
    return;
  }

  try {
    const [updateResult] = await db.query(
      "UPDATE purchase_orders SET customer_signature = ? WHERE id = ?",
      [signature, poId]
    );
    if (!updateResult.affectedRows) {
      return res.status(404).json({ error: "Purchase order not found" });
    }
    res.json({ message: "Signature saved successfully" });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ error: "Internal server error" });
  }
});

// Generate PDF
const stateCodes = require("../utils/stateCodes");
const PDFDocument = require("pdfkit");
const { convertToWords } = require("../utils/convertToWords");
const hsnCodeMap = require("../utils/hsnCodeMap");

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
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=PO_${poDetails[0].po_number}.pdf`
    );

    doc.pipe(res);

    const left = 15;
    const right = 575;
    const pageWidth = right - left;

    const drawLine = (y) => doc.moveTo(left, y).lineTo(right, y).stroke();
    const drawVerticalLine = (x, startY, endY) =>
      doc.moveTo(x, startY).lineTo(x, endY).stroke();
    const formatDate = (dateStr) =>
      new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });

    const data = poDetails[0];
    const cgstRate = 9;
    const sgstRate = 9;

    doc.rect(left, 20, pageWidth, 770).stroke();

    const logoPath = path.resolve(__dirname, "../uploads/logo/bidz.jpeg");
    doc.image(logoPath, 30, 70, { width: 140 });

    doc.fontSize(14).font("Helvetica-Bold").text("Purchase Order", left + 325, 35);
    doc.moveTo(210, 55).lineTo(575, 55).stroke();
    doc.moveTo(210, 20).lineTo(210, 165).stroke();

    const top = 65;
    const offsetWidth = doc.page.width * 0.9;
    const offsetX = doc.page.width * 0.22;

    doc.fontSize(12).font("Helvetica-Bold").text(data.customer_company, offsetX, top, { width: offsetWidth, align: "center" });
    doc.fontSize(10).font("Helvetica").text(data.customer_address, offsetX, top + 20, { width: offsetWidth, align: "center" });
    doc.text(`${data.customer_city}, ${data.customer_state} - ${data.customer_postal_code}`, offsetX, top + 35, { width: offsetWidth, align: "center" });
    doc.text(`Email: ${data.customer_email}`, offsetX, top + 55, { width: offsetWidth, align: "center" });

    doc.moveTo(210, 140).lineTo(575, 140).stroke();

    doc.fontSize(10).font("Helvetica-Bold").text("GSTIN:", left + 200, 150)
      .font("Helvetica").text(data.customer_gst_number || "N/A", left + 233, 150)
      .font("Helvetica-Bold").text("CIN NO:", left + 420, 150)
      .font("Helvetica").text(data.customer_company_registrationNo || "N/A", left + 458, 150);
    drawLine(165);

    doc.fontSize(10).font("Helvetica-Bold").text("Purchase Order No:", left + 5, 175)
      .font("Helvetica").text(data.po_number, left + 100, 175)
      .font("Helvetica-Bold").text("Purchase Order Date:", left + 350, 175)
      .font("Helvetica").text(formatDate(data.order_date), left + 455, 175);
    drawLine(190);

    doc.fontSize(12).font("Helvetica-Bold")
      .text("Vendor Details:", left + 5, 200)
      .text("Billing Details:", left + 190, 200)
      .text("Shipping Details:", left + 360, 200);
    drawLine(220);

    drawVerticalLine(200, 190, 328);
    drawVerticalLine(370, 190, 328);

    doc.font("Helvetica-Bold").fontSize(10).text(`${data.vendor_company}`, left + 5, 230)
      .font("Helvetica").text(`${data.vendor_address}`, left + 5, 245)
      .text(`${data.vendor_city}, ${data.vendor_state} - ${data.vendor_postal_code}`, left + 5, 260)
      .font("Helvetica-Bold").text(`GST: ${data.vendor_gst_number || "N/A"}`, left + 5, 290)
      .text(`State Code: ${stateCodes[data.vendor_state] || "00"}`, left + 5, 305);

    doc.font("Helvetica-Bold").fontSize(10).text(`${data.customer_company}`, left + 190, 230)
      .font("Helvetica").text(`${data.customer_address}`, left + 190, 245)
      .text(`${data.customer_city}, ${data.customer_state} - ${data.customer_postal_code}`, left + 190, 260)
      .font("Helvetica-Bold").text(`GST: ${data.customer_gst_number || "N/A"}`, left + 190, 290)
      .text(`State Code: ${stateCodes[data.customer_state] || "00"}`, left + 190, 305);
    drawLine(327);

    doc.font("Helvetica-Bold").fontSize(10).text(`${data.customer_company}`, left + 360, 230)
      .font("Helvetica").text(`${data.ship_to_address || data.customer_address}`, left + 360, 245)
      .text(`${data.ship_to_city || data.customer_city}, ${data.ship_to_state || data.customer_state} - ${data.ship_to_postal_code || data.customer_postal_code}`, left + 360, 260)
      .font("Helvetica-Bold").text(`GST: ${data.ship_to_gst_number || data.customer_gst_number || "N/A"}`, left + 360, 290)
      .text(`State Code: ${stateCodes[data.ship_to_state || data.customer_state] || "00"}`, left + 360, 305);

    const tableTop = 340;
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Sr.No", left + 5, tableTop);
    doc.text("Item", left + 55, tableTop);
    doc.text("Description", left + 150, tableTop);
    doc.text("HSN", left + 260, tableTop);
    doc.text("Qty", left + 305, tableTop);
    doc.text("UOM", left + 335, tableTop);
    doc.text("Rate", left + 375, tableTop);
    doc.text("CGST", left + 420, tableTop);
    doc.text("SGST", left + 460, tableTop);
    doc.text("Amount", left + 502, tableTop);

    drawVerticalLine(left + 35, tableTop - 13, tableTop + 140);
    drawVerticalLine(left + 120, tableTop - 13, tableTop + 140);
    drawVerticalLine(left + 250, tableTop - 13, tableTop + 140);
    drawVerticalLine(left + 300, tableTop - 13, tableTop + 235);
    drawVerticalLine(left + 330, tableTop - 13, tableTop + 140);
    drawVerticalLine(left + 365, tableTop - 13, tableTop + 140);
    drawVerticalLine(left + 415, tableTop - 13, tableTop + 140);
    drawVerticalLine(left + 455, tableTop - 13, tableTop + 235);
    drawVerticalLine(left + 495, tableTop - 13, tableTop + 140);
    drawLine(tableTop + 20);

    let y = tableTop + 25;
    let subtotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;

    poDetails.forEach((item, idx) => {
      if (y > 720) { doc.addPage(); y = 50; }
      const itemTotal = parseFloat(item.total_price);
      const cgst = itemTotal * (cgstRate / 100);
      const sgst = itemTotal * (sgstRate / 100);
      subtotal += itemTotal; totalCgst += cgst; totalSgst += sgst;
      doc.font("Helvetica").text(idx + 1, left + 5, y);
      doc.fontSize(9)
        .text(`${item.product_name} - ${item.product_category}`, left + 38, y, { width: 80 })
        .text(item.product_description, left + 123, y, { width: 120 })
        .text(hsnCodeMap[item.product_category] || "-", left + 253, y)
        .text(item.quantity.toString(), left + 310, y)
        .text("NOS", left + 340, y)
        .text(parseFloat(item.unit_price).toFixed(2), left + 370, y)
        .text(`${cgstRate}%`, left + 430, y)
        .text(`${sgstRate}%`, left + 470, y)
        .text(itemTotal.toFixed(2), left + 500, y);
      y += 115;
    });

    drawLine(y); y += 10;
    const totalGst = totalCgst + totalSgst;
    const grandTotal = subtotal + totalGst;

    doc.font("Helvetica-Bold").text("Sub Total:", left + 320, y);
    doc.text(subtotal.toFixed(2), left + 460, y, { align: "right", width: 80 });
    y += 20;
    doc.text("Total GST (CGST + SGST):", left + 320, y);
    doc.text(totalGst.toFixed(2), left + 460, y, { align: "right", width: 80 });
    y += 30;
    doc.fontSize(12).text("Grand Total:", left + 320, y + 20);
    doc.text(grandTotal.toFixed(2), left + 460, y + 20, { align: "right", width: 80 });

    doc.font("Helvetica-Bold").fontSize(10).text("Total Amount in Words:", left + 5, y - 50)
      .font("Helvetica").text(`Rupees ${convertToWords(Math.round(grandTotal))} Only`, left + 5, y - 35, { width: 400 });
    doc.font("Helvetica-Bold").text("GST Amount in Words:", left + 5, y - 10)
      .font("Helvetica").text(`Rupees ${convertToWords(Math.round(totalGst))} Only`, left + 5, y + 5, { width: 400 });
    y += 35;
    drawLine(y); y += 10;

    doc.font("Helvetica-Bold").text("Terms & Conditions:", left + 5, y)
      .font("Helvetica")
      .text("1.Payment Terms: 100% advance against P.I.", left + 5, y + 20)
      .text("2. Validity: 30 Days.", left + 5, y + 35)
      .text("3. Mode of Transportation: Surface", left + 5, y + 50);
    y += 120;
    doc.font("Helvetica-Bold").text("Authorized Signatory", right - 150, y);

      if (data.customer_signature) {
        try {
          doc.image(data.customer_signature, right - 150, y - 40, { width: 100, height: 40 });
        } catch (error) {
          console.error("Server error", { code: error.code, errno: error.errno });
        }
      }

    doc.end();
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;


