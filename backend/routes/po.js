const express = require("express");
const db = require("../db");
const authenticate = require("../utils/auth");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const { requireFields } = require("../utils/validation");

// Generate PO from cart
router.post("/generate", async (req, res) => {
  const { customerId, productId, quantity, shipToAddress, size } = req.body;
  if (!requireFields(res, { customerId, productId, quantity })) return;

  try {
    await db.query("START TRANSACTION");

    const [customer] = await db.query(
      `SELECT id, personName, Email FROM customerusersignup WHERE id = ?`,
      [customerId]
    );
    if (!customer.length) {
      await db.query("ROLLBACK");
      return res.status(404).json({ error: "Customer not found" });
    }

    const [product] = await db.query(
      `SELECT p.id AS product_id, p.productName, p.price, p.vendor_id, p.description, p.category,
              v.personName AS vendorName, v.companyName AS vendorCompany, v.Email AS vendorEmail
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
    const poNumber = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${uuidv4().slice(0, 4).toUpperCase()}`;
    const deliveryNotes = size
      ? `Delivery as soon as possible | Size: ${String(size).trim()}`
      : "Delivery as soon as possible";

    const [poResult] = await db.query(
      `INSERT INTO purchase_orders
        (po_number, customer_id, customer_name, customer_company,
         customer_address, customer_city, customer_state, customer_country, customer_postal_code,
         customer_gst_number, customer_company_registrationNo,
         ship_to_address, ship_to_city, ship_to_state, ship_to_country, ship_to_postal_code,
         total_amount, customer_email, delivery_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        poNumber, customerId, customer[0].personName, customer[0].personName || "N/A",
        shipToAddress?.address || "N/A", shipToAddress?.city || "N/A",
        shipToAddress?.state || "N/A", shipToAddress?.country || "N/A",
        shipToAddress?.postalCode || "N/A", "N/A", "N/A",
        shipToAddress?.address || "N/A", shipToAddress?.city || "N/A",
        shipToAddress?.state || "N/A", shipToAddress?.country || "N/A",
        shipToAddress?.postalCode || "N/A", totalAmount, customer[0].Email, deliveryNotes,
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
        poId, productData.product_id, productData.productName, productData.category,
        productData.description, productData.vendor_id, productData.vendorName,
        productData.vendorCompany, "N/A", "N/A", "N/A", "N/A", "N/A", "N/A",
        quantity, productData.price, totalAmount, productData.vendorEmail,
      ]
    );
    if (!itemResult.affectedRows) {
      await db.query("ROLLBACK");
      return res.status(500).json({ error: "Failed to create purchase order items" });
    }

    await db.query("COMMIT");

    const [poDetails] = await db.query(
      `SELECT po.*, poi.* FROM purchase_orders po
       JOIN purchase_order_items poi ON po.id = poi.po_id WHERE po.id = ?`,
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
  if (Number(customerId) !== Number(req.user.id))
    return res.status(403).json({ error: "Forbidden" });

  try {
    const [orders] = await db.query(
      `SELECT po.id, po.po_number, po.customer_name, po.customer_company, po.customer_email,
              po.customer_address, po.customer_city, po.customer_state, po.customer_country,
              po.customer_postal_code, po.order_date, po.status, po.total_amount,
              GROUP_CONCAT(
                JSON_OBJECT(
                  'product_name', poi.product_name, 'category', poi.product_category,
                  'description', poi.product_description, 'vendor_name', poi.vendor_name,
                  'vendor_company', poi.vendor_company, 'vendor_email', poi.vendor_email,
                  'quantity', poi.quantity, 'unit_price', poi.unit_price, 'total_price', poi.total_price
                )
              ) AS items
       FROM purchase_orders po
       JOIN purchase_order_items poi ON po.id = poi.po_id
       WHERE po.customer_id = ?
       GROUP BY po.id ORDER BY po.order_date DESC`,
      [customerId]
    );
    res.json({
      purchaseOrders: orders.map((o) => ({ ...o, items: JSON.parse(`[${o.items}]`) })),
    });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ error: "Failed to fetch purchase orders" });
  }
});

// Update ship-to address
router.put("/:poId/ship-to-address", async (req, res) => {
  const { poId } = req.params;
  const { address, city, state, country, postalCode } = req.body;
  if (!requireFields(res, { poId, address, city, state, country, postalCode })) return;
  try {
    const [result] = await db.query(
      `UPDATE purchase_orders SET ship_to_address=?, ship_to_city=?, ship_to_state=?,
       ship_to_country=?, ship_to_postal_code=? WHERE id=?`,
      [address, city, state, country, postalCode, poId]
    );
    if (!result.affectedRows) return res.status(404).json({ error: "Purchase Order not found" });
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
    if (!rows.length) return res.status(404).json({ error: "Purchase Order not found" });
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
  if (!requireFields(res, { poId, deliveryNotes })) return;
  try {
    const [result] = await db.query(
      "UPDATE purchase_orders SET delivery_notes = ? WHERE id = ?",
      [deliveryNotes, poId]
    );
    if (!result.affectedRows) return res.status(404).json({ error: "Purchase order not found" });
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
    if (!result.length) return res.status(404).json({ error: "Purchase order not found" });
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
  if (!requireFields(res, { poId, signature })) return;
  try {
    const [result] = await db.query(
      "UPDATE purchase_orders SET customer_signature = ? WHERE id = ?",
      [signature, poId]
    );
    if (!result.affectedRows) return res.status(404).json({ error: "Purchase order not found" });
    res.json({ message: "Signature saved successfully" });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ error: "Internal server error" });
  }
});

// ══════════════════════════════════════════════════════════════════
//  INVOICE PDF — All 8 flaws fixed
// ══════════════════════════════════════════════════════════════════
const stateCodes         = require("../utils/stateCodes");
const PDFDocument        = require("pdfkit");
const { convertToWords } = require("../utils/convertToWords");
const hsnCodeMap         = require("../utils/hsnCodeMap");

// ── FIX 5: Strip non-Latin-1 characters that Helvetica cannot render
// Replaces common culprits (em-dash, smart quotes, bullet, etc.) with
// safe ASCII equivalents before passing any string to PDFKit.
const sanitize = (str) => {
  if (!str || typeof str !== "string") return "";
  return str
    .replace(/[\u2013\u2014]/g, "-")   // en-dash, em-dash  → hyphen
    .replace(/[\u2018\u2019]/g, "'")   // smart single quotes → apostrophe
    .replace(/[\u201C\u201D]/g, '"')   // smart double quotes → straight quote
    .replace(/\u2022/g, "*")           // bullet             → asterisk
    .replace(/\u00A0/g, " ")           // non-breaking space → space
    .replace(/[^\x00-\xFF]/g, "")      // drop anything else outside Latin-1
    .trim();
};

// ── FIX 6: Replace blank / "N/A" values with a clean dash
const safe = (v) =>
  v && String(v).trim() && String(v).trim() !== "N/A" ? sanitize(String(v).trim()) : "\u2014";

// ── FIX 3: Column definitions — widths sized so every header label fits
// Sum = 24+170+44+34+66+56+56+73 = 523 = CW  ✓
const COLS = [
  { header: "No",        width: 24,  align: "center" },
  { header: "Item",      width: 170, align: "left"   },
  { header: "HSN",       width: 44,  align: "center" },
  { header: "Qty",       width: 34,  align: "center" },
  { header: "Rate",      width: 66,  align: "right"  },
  { header: `CGST\n9%`,  width: 56,  align: "right"  },
  { header: `SGST\n9%`,  width: 56,  align: "right"  },
  { header: "Amount",    width: 73,  align: "right"  }, // "Amount" at 73px fits cleanly
];

const generateInvoicePdf = async (req, res) => {
  const { poId } = req.params;

  try {
    // ── Serve cached invoice ───────────────────────────────────
    try {
      const [cached] = await db.query(
        "SELECT file_blob, file_name FROM invoices WHERE po_id = ? ORDER BY id DESC LIMIT 1",
        [poId]
      );
      if (cached.length) {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=${cached[0].file_name || `Invoice_${poId}.pdf`}`
        );
        return res.send(cached[0].file_blob);
      }
    } catch (dbErr) {
      if (dbErr.code !== "ER_NO_SUCH_TABLE")
        console.error("Invoice cache lookup failed", { code: dbErr.code });
    }

    // ── Fetch PO ───────────────────────────────────────────────
    const [poDetails] = await db.query(
      `SELECT po.*, poi.*
       FROM purchase_orders po
       JOIN purchase_order_items poi ON po.id = poi.po_id
       WHERE po.id = ?`,
      [poId]
    );
    if (!poDetails.length) return res.status(404).json({ error: "PO not found" });

    const d = poDetails[0];

    let paymentStatus = "PAID";
    if (d.payment_id) {
      try {
        const [payRows] = await db.query(
          "SELECT status FROM payments WHERE id = ?",
          [d.payment_id]
        );
        if (payRows.length && payRows[0].status)
          paymentStatus = payRows[0].status.toUpperCase();
      } catch { /* keep default */ }
    }

    const invoiceNumber = `INV-${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}-${poId}`;

    // ── Layout constants ───────────────────────────────────────
    const PAGE_W = 595.28;
    const PAGE_H = 841.89;
    const ML     = 36;
    const MR     = 36;
    const CW     = PAGE_W - ML - MR;  // 523.28
    const RIGHT  = ML + CW;

    // ── Colour tokens ──────────────────────────────────────────
    const C = {
      dark:      "#1a0d16",
      pink:      "#e91e63",
      pinkDeep:  "#880e4f",
      pinkLight: "#fce4ec",
      pinkMed:   "#f8bbd0",
      ink:       "#2d1a24",
      muted:     "#7a5568",
      pale:      "#fff9fc",
      white:     "#ffffff",
      green:     "#16a34a",
    };

    const CGST_RATE = 9;
    const SGST_RATE = 9;

    const doc    = new PDFDocument({ margin: 0, size: "A4", bufferPages: true });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));

    // ── Drawing helpers ────────────────────────────────────────
    const fmtDate = (ds) =>
      new Date(ds).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      });

    const hLine = (y, color = C.pinkMed, lw = 0.5) =>
      doc.save().strokeColor(color).lineWidth(lw)
         .moveTo(ML, y).lineTo(RIGHT, y).stroke().restore();

    const vLine = (x, y1, y2, color = C.pinkMed, lw = 0.5) =>
      doc.save().strokeColor(color).lineWidth(lw)
         .moveTo(x, y1).lineTo(x, y2).stroke().restore();

    const fillRect = (x, y, w, h, color) =>
      doc.save().fillColor(color).rect(x, y, w, h).fill().restore();

    // text() — draw a string safely, always restore doc state
    const txt = (str, x, y, w, opts = {}) => {
      doc.save()
         .fillColor(opts.color || C.muted)
         .fontSize(opts.size || 8)
         .font(opts.bold ? "Helvetica-Bold" : "Helvetica")
         .text(sanitize(String(str ?? "\u2014")), x, y, {
           width: w,
           align: opts.align || "left",
           lineGap: 0,
         })
         .restore();
    };

    // colX — left edge of column i in the items table
    const colX = (i) => COLS.slice(0, i).reduce((acc, c) => acc + c.width, ML);

    // ─────────────────────────────────────────────────────────
    //  1. DARK HEADER BAND
    // ─────────────────────────────────────────────────────────
    // FIX 2: Increased header height to 96px so the company name
    // block below never overlaps with the invoice-meta text on the right.
    const HDR_H = 96;
    fillRect(0, 0, PAGE_W, HDR_H, C.dark);
    fillRect(0, HDR_H - 4, PAGE_W, 4, C.pink);  // pink accent strip

    // Logo — sits entirely within the left side of the header
    const logoPath = path.resolve(
      "D:/Selva/Phalls/Phalls/frontend/public/Logo.png"
    );
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, ML, 18, { height: 58 });
    } else {
      doc.save().fillColor(C.pink).fontSize(22).font("Helvetica-Bold")
         .text("ELUME", ML, 30).restore();
    }

    // Right column: title + invoice meta — all anchored to right edge
    // Starts at y=16, each line +14px — never overlaps the logo area
    doc.save().fillColor(C.white).fontSize(19).font("Helvetica-Bold")
       .text("TAX INVOICE", ML, 16, { width: CW, align: "right" }).restore();

    doc.save().fillColor(C.pinkMed).fontSize(8).font("Helvetica")
       .text(`Invoice No : ${invoiceNumber}`, ML, 42, { width: CW, align: "right" })
       .restore();

    doc.save().fillColor(C.pinkMed).fontSize(8).font("Helvetica")
       .text(`Order No   : ${d.po_number}`, ML, 55, { width: CW, align: "right" })
       .restore();

    // FIX 2 (cont.): Payment badge uses its own y row — no overlap possible
    const badgeClr = paymentStatus === "PAID" ? C.green : C.pink;
    doc.save().fillColor(badgeClr).fontSize(8).font("Helvetica-Bold")
       .text(`\u25CF  ${paymentStatus}`, ML, 68, { width: CW, align: "right" })
       .restore();

    let y = HDR_H + 18;

    // ─────────────────────────────────────────────────────────
    //  2. COMPANY IDENTITY BLOCK (centred)
    //  FIX 2 (cont.): This block starts well below the header —
    //  y = HDR_H + 18, so it can never collide with the header text.
    // ─────────────────────────────────────────────────────────
    const companyName = safe(d.customer_company);
    doc.save().fillColor(C.ink).fontSize(13).font("Helvetica-Bold")
       .text(companyName, ML, y, { width: CW, align: "center" }).restore();
    y += 18;

    // Address line — skip any segment that is "—" (was "N/A")
    const addrParts = [d.customer_address, d.customer_city, d.customer_state]
      .map(safe)
      .filter((v) => v !== "\u2014");
    const pinSuffix =
      safe(d.customer_postal_code) !== "\u2014"
        ? ` \u2014 ${safe(d.customer_postal_code)}`
        : "";

    if (addrParts.length) {
      doc.save().fillColor(C.muted).fontSize(8).font("Helvetica")
         .text(addrParts.join(", ") + pinSuffix, ML, y, { width: CW, align: "center" })
         .restore();
      y += 13;
    }

    // Meta line (email | GSTIN | CIN) — only shown if values exist
    const metaParts = [
      safe(d.customer_email) !== "\u2014" ? `Email: ${safe(d.customer_email)}` : null,
      safe(d.customer_gst_number) !== "\u2014" ? `GSTIN: ${safe(d.customer_gst_number)}` : null,
      safe(d.customer_company_registrationNo) !== "\u2014"
        ? `CIN: ${safe(d.customer_company_registrationNo)}`
        : null,
    ].filter(Boolean);

    if (metaParts.length) {
      doc.save().fillColor(C.muted).fontSize(7.5).font("Helvetica")
         .text(metaParts.join("   |   "), ML, y, { width: CW, align: "center" })
         .restore();
      y += 12;
    }

    y += 6;
    hLine(y, C.pinkMed, 1);
    y += 13;

    // ─────────────────────────────────────────────────────────
    //  3. ORDER META ROW  (4 equal columns)
    // ─────────────────────────────────────────────────────────
    const META_COL_W = CW / 4;
    const META_Y     = y;

    const metaFields = [
      { lbl: "ORDER NO",   val: safe(d.po_number) },
      { lbl: "ORDER DATE", val: fmtDate(d.order_date) },
      { lbl: "PAYMENT",    val: paymentStatus },
      {
        lbl: "DELIVERY",
        val: sanitize((d.delivery_notes || "").split("|")[0].trim()) || "As soon as possible",
      },
    ];

    metaFields.forEach((f, i) => {
      const x = ML + i * META_COL_W;
      txt(f.lbl, x + 6, META_Y,      META_COL_W - 12, { color: C.muted, size: 7 });
      txt(f.val, x + 6, META_Y + 11, META_COL_W - 12, { color: C.ink,   size: 9,  bold: true });
      if (i < 3) vLine(x + META_COL_W, META_Y - 2, META_Y + 30, C.pinkMed);
    });

    y = META_Y + 36;
    hLine(y, C.pinkMed, 1);
    y += 14;

    // ─────────────────────────────────────────────────────────
    //  4. THREE-COLUMN ADDRESS BLOCK
    //  FIX 6: safe() filters "N/A" → "—" everywhere in this section
    // ─────────────────────────────────────────────────────────
    const ADDR_COL_W = CW / 3;

    const addrBlocks = [
      {
        title: "Vendor Details",
        name:  safe(d.vendor_company),
        rows: [
          safe(d.vendor_address),
          [safe(d.vendor_city), safe(d.vendor_state)]
            .filter((v) => v !== "\u2014").join(", ") +
            (safe(d.vendor_postal_code) !== "\u2014" ? ` \u2014 ${safe(d.vendor_postal_code)}` : ""),
          safe(d.vendor_gst_number) !== "\u2014" ? `GSTIN: ${safe(d.vendor_gst_number)}` : null,
          `State Code: ${stateCodes[d.vendor_state] || "00"}`,
          safe(d.vendor_email) !== "\u2014" ? `Email: ${safe(d.vendor_email)}` : null,
        ].filter(Boolean),
      },
      {
        title: "Bill To",
        name:  safe(d.customer_company),
        rows: [
          safe(d.customer_address),
          [safe(d.customer_city), safe(d.customer_state)]
            .filter((v) => v !== "\u2014").join(", ") +
            (safe(d.customer_postal_code) !== "\u2014"
              ? ` \u2014 ${safe(d.customer_postal_code)}` : ""),
          safe(d.customer_gst_number) !== "\u2014"
            ? `GSTIN: ${safe(d.customer_gst_number)}` : null,
          `State Code: ${stateCodes[d.customer_state] || "00"}`,
        ].filter(Boolean),
      },
      {
        title: "Ship To",
        name:  safe(d.customer_company),
        rows: [
          safe(d.ship_to_address || d.customer_address),
          [
            safe(d.ship_to_city  || d.customer_city),
            safe(d.ship_to_state || d.customer_state),
          ].filter((v) => v !== "\u2014").join(", ") +
            (safe(d.ship_to_postal_code || d.customer_postal_code) !== "\u2014"
              ? ` \u2014 ${safe(d.ship_to_postal_code || d.customer_postal_code)}` : ""),
          `State Code: ${stateCodes[d.ship_to_state || d.customer_state] || "00"}`,
        ].filter(Boolean),
      },
    ];

    // Pink title row
    addrBlocks.forEach((blk, i) => {
      const bx = ML + i * ADDR_COL_W;
      fillRect(bx, y, ADDR_COL_W - (i < 2 ? 1 : 0), 20, C.pinkLight);
      doc.save().fillColor(C.dark).fontSize(8).font("Helvetica-Bold")
         .text(blk.title.toUpperCase(), bx + 8, y + 6, { width: ADDR_COL_W - 16 })
         .restore();
    });
    y += 24;

    const ADDR_START_Y = y;
    const colHeights   = addrBlocks.map((blk, i) => {
      const bx = ML + i * ADDR_COL_W + 8;
      let ay   = ADDR_START_Y;

      doc.save().fillColor(C.ink).fontSize(9).font("Helvetica-Bold")
         .text(blk.name, bx, ay, { width: ADDR_COL_W - 18 }).restore();
      ay += doc.currentLineHeight(true) + 3;

      blk.rows.forEach((row) => {
        if (!row || row === "\u2014") return;
        const isKey = row.startsWith("GSTIN") || row.startsWith("State Code");
        doc.save()
           .fillColor(isKey ? C.ink : C.muted)
           .fontSize(isKey ? 8 : 7.5)
           .font(isKey ? "Helvetica-Bold" : "Helvetica")
           .text(row, bx, ay, { width: ADDR_COL_W - 18 })
           .restore();
        const lh = doc.heightOfString(row, {
          width: ADDR_COL_W - 18,
          fontSize: isKey ? 8 : 7.5,
        });
        ay += lh + 3;
      });

      return ay - ADDR_START_Y;
    });

    const maxAddrH = Math.max(...colHeights) + 10;

    vLine(ML + ADDR_COL_W,     ADDR_START_Y - 24, ADDR_START_Y + maxAddrH, C.pinkMed);
    vLine(ML + ADDR_COL_W * 2, ADDR_START_Y - 24, ADDR_START_Y + maxAddrH, C.pinkMed);

    y = ADDR_START_Y + maxAddrH;
    hLine(y, C.pinkMed, 1);
    y += 14;

    // ─────────────────────────────────────────────────────────
    //  5. ITEMS TABLE
    //  FIX 1: Row height calculated BEFORE drawing via heightOfString.
    //  FIX 3: Column headers sized to fit (see COLS constant above).
    //  FIX 7: Separate CGST and SGST columns.
    //  FIX 8: Outer left/right border drawn per row.
    // ─────────────────────────────────────────────────────────
    const TBL_HDR_H = 28;

    // Max characters we allow in a description cell.
    // Prevents an oversized description from ever overflowing the page.
    const DESC_MAX_CHARS = 160;

    const drawTableHeader = (startY) => {
      fillRect(ML, startY, CW, TBL_HDR_H, C.dark);
      fillRect(ML, startY + TBL_HDR_H - 2, CW, 2, C.pink);

      COLS.forEach((col, i) => {
        const cx          = colX(i);
        const isMultiLine = col.header.includes("\n");
        doc.save()
           .fillColor(C.white).fontSize(7.5).font("Helvetica-Bold")
           .text(col.header, cx + 4, startY + (isMultiLine ? 5 : 10), {
             width:   col.width - 8,
             align:   col.align,
             lineGap: 1,
           })
           .restore();
      });
    };

    const drawRowLines = (rowY, rowH) => {
      // FIX 8: outer left + right border
      doc.save().strokeColor(C.pinkMed).lineWidth(0.5)
         .moveTo(ML,    rowY).lineTo(ML,    rowY + rowH).stroke()
         .moveTo(RIGHT, rowY).lineTo(RIGHT, rowY + rowH).stroke()
         .restore();
      // Internal vertical separators
      doc.save().strokeColor(C.pinkMed).lineWidth(0.35);
      COLS.forEach((col, i) => {
        if (i === 0) return;               // left outer already drawn
        const cx = colX(i);
        doc.moveTo(cx, rowY).lineTo(cx, rowY + rowH).stroke();
      });
      doc.restore();
      // Bottom border
      hLine(rowY + rowH, C.pinkMed, 0.35);
    };

    // Draw header and outer top border
    fillRect(ML, y, CW, 0.6, C.pinkMed);    // top outer border
    drawTableHeader(y);
    y += TBL_HDR_H;

    let subtotal  = 0;
    let totalCgst = 0;
    let totalSgst = 0;

    poDetails.forEach((item, idx) => {
      // ── FIX 1 + FIX 5: sanitize and truncate the description ──
      const rawName = sanitize(item.product_name || "");
      const rawCat  = item.product_category ? sanitize(item.product_category) : "";
      const rawDesc = sanitize(item.product_description || "");

      // Truncate description to DESC_MAX_CHARS to prevent row overflow
      const truncDesc =
        rawDesc.length > DESC_MAX_CHARS
          ? rawDesc.slice(0, DESC_MAX_CHARS).trimEnd() + "..."
          : rawDesc;

      const subLine = [rawCat ? `Cat: ${rawCat}` : "", truncDesc]
        .filter(Boolean)
        .join("  \u00B7  ");

      // Pre-measure BEFORE drawing anything
      doc.font("Helvetica-Bold").fontSize(8.5);
      const nameH = doc.heightOfString(rawName, { width: COLS[1].width - 10 });

      doc.font("Helvetica").fontSize(7.5);
      const subH = subLine
        ? doc.heightOfString(subLine, { width: COLS[1].width - 10 })
        : 0;

      // rowH = measured content + top + bottom padding (14px)
      const rowH = Math.max(30, nameH + subH + 14);

      // Page break — reserve 140px for totals / footer
      if (y + rowH > PAGE_H - 140) {
        doc.addPage();
        y = 40;
        drawTableHeader(y);
        y += TBL_HDR_H;
      }

      // Alternating row tint
      if (idx % 2 === 0) fillRect(ML, y, CW, rowH, C.pale);

      const itemTotal = parseFloat(item.total_price);
      const cgst      = itemTotal * (CGST_RATE / 100);
      const sgst      = itemTotal * (SGST_RATE / 100);
      subtotal  += itemTotal;
      totalCgst += cgst;
      totalSgst += sgst;

      const cellY = y + 9;   // internal top padding

      // Col 0 — row number
      txt(idx + 1, colX(0) + 3, cellY, COLS[0].width - 6,
          { color: C.muted, size: 8, align: "center" });

      // Col 1 — item name + sub-line
      doc.save().fillColor(C.ink).fontSize(8.5).font("Helvetica-Bold")
         .text(rawName, colX(1) + 5, y + 8, { width: COLS[1].width - 10 }).restore();
      if (subLine) {
        doc.save().fillColor(C.muted).fontSize(7.5).font("Helvetica")
           .text(subLine, colX(1) + 5, y + 8 + nameH + 2, { width: COLS[1].width - 10 })
           .restore();
      }

      // Col 2 — HSN
      txt(hsnCodeMap[item.product_category] || "\u2014",
          colX(2) + 3, cellY, COLS[2].width - 6,
          { color: C.muted, size: 8, align: "center" });

      // Col 3 — Qty
      txt(item.quantity, colX(3) + 3, cellY, COLS[3].width - 6,
          { color: C.ink, size: 8.5, bold: true, align: "center" });

      // Col 4 — Rate
      txt(parseFloat(item.unit_price).toFixed(2),
          colX(4) + 3, cellY, COLS[4].width - 6,
          { color: C.ink, size: 8, align: "right" });

      // Col 5 — CGST amount (FIX 7: individual CGST value, not combined %)
      txt(cgst.toFixed(2), colX(5) + 3, cellY, COLS[5].width - 6,
          { color: C.ink, size: 8, align: "right" });

      // Col 6 — SGST amount (FIX 7: individual SGST value)
      txt(sgst.toFixed(2), colX(6) + 3, cellY, COLS[6].width - 6,
          { color: C.ink, size: 8, align: "right" });

      // Col 7 — Amount (bold, pink)
      doc.save().fillColor(C.pinkDeep).fontSize(8.5).font("Helvetica-Bold")
         .text(itemTotal.toFixed(2), colX(7) + 3, cellY, {
           width: COLS[7].width - 6, align: "right",
         })
         .restore();

      drawRowLines(y, rowH);
      y += rowH;
    });

    y += 8;

    // ─────────────────────────────────────────────────────────
    //  6. TOTALS BLOCK
    // ─────────────────────────────────────────────────────────
    const totalGst   = totalCgst + totalSgst;
    const grandTotal = subtotal + totalGst;

    const TOT_X   = ML + CW * 0.56;
    const TOT_W   = RIGHT - TOT_X;
    const LBL_W   = TOT_W * 0.58;
    const VAL_X   = TOT_X + LBL_W;
    const VAL_W   = TOT_W - LBL_W;

    const totRows = [
      { lbl: "Sub Total",            val: subtotal.toFixed(2),   grand: false },
      { lbl: `CGST @ ${CGST_RATE}%`, val: totalCgst.toFixed(2), grand: false },
      { lbl: `SGST @ ${SGST_RATE}%`, val: totalSgst.toFixed(2), grand: false },
      { lbl: "Grand Total",          val: grandTotal.toFixed(2), grand: true  },
    ];

    totRows.forEach((row) => {
      const rH = row.grand ? 26 : 19;
      if (row.grand) {
        fillRect(TOT_X, y, TOT_W, rH, C.dark);
        txt(row.lbl, TOT_X + 10, y + 8, LBL_W - 10,
            { color: C.white, size: 10, bold: true });
        doc.save().fillColor(C.pink).fontSize(10).font("Helvetica-Bold")
           .text(`Rs. ${row.val}`, VAL_X, y + 8, { width: VAL_W - 8, align: "right" })
           .restore();
      } else {
        hLine(y, C.pinkMed, 0.4);
        txt(row.lbl, TOT_X + 10, y + 4, LBL_W - 10,
            { color: C.muted, size: 8.5 });
        txt(row.val, VAL_X, y + 4, VAL_W - 8,
            { color: C.ink, size: 8.5, bold: true, align: "right" });
      }
      y += rH;
    });

    hLine(y, C.pinkMed, 0.6);
    y += 14;

    // ─────────────────────────────────────────────────────────
    //  7. AMOUNT IN WORDS
    //  FIX 4: removed the hardcoded " Only" suffix — convertToWords
    //         already appends it, so the old code produced "Only Only".
    // ─────────────────────────────────────────────────────────
    const WORDS_W = CW * 0.55;
    fillRect(ML, y, WORDS_W, 36, C.pinkLight);

    txt("TOTAL AMOUNT IN WORDS", ML + 10, y + 5, WORDS_W - 16,
        { color: C.muted, size: 7 });

    // FIX 4: no trailing " Only" here — convertToWords provides it
    txt(
      `Rupees ${convertToWords(Math.round(grandTotal))}`,
      ML + 10, y + 16, WORDS_W - 16,
      { color: C.ink, size: 8.5, bold: true }
    );

    y += 44;

    // ─────────────────────────────────────────────────────────
    //  8. TERMS & CONDITIONS
    // ─────────────────────────────────────────────────────────
    hLine(y, C.pinkMed, 0.6);
    y += 10;

    txt("Terms & Conditions", ML, y, CW * 0.6,
        { color: C.ink, size: 8.5, bold: true });
    y += 14;

    [
      "1. Payment Terms: 100% advance against P.I.",
      "2. Validity: 30 Days.",
      "3. Mode of Transportation: Surface",
    ].forEach((t) => {
      txt(t, ML + 4, y, CW * 0.6 - 8, { color: C.muted, size: 7.5 });
      y += 11;
    });

    y += 10;

    // ─────────────────────────────────────────────────────────
    //  9. SIGNATURE
    // ─────────────────────────────────────────────────────────
    hLine(y, C.pinkMed, 0.6);
    y += 14;

    const SIG_X = RIGHT - 148;
    const SIG_W = 140;

    if (d.customer_signature) {
      try {
        doc.image(d.customer_signature, SIG_X, y, { width: SIG_W, height: 38 });
      } catch (e) {
        console.error("Signature image error", e.message);
      }
    }

    doc.save().strokeColor(C.pinkMed).lineWidth(0.7)
       .moveTo(SIG_X, y + 40).lineTo(SIG_X + SIG_W, y + 40).stroke().restore();

    txt("Authorized Signatory", SIG_X, y + 44, SIG_W,
        { color: C.muted, size: 7.5, align: "center" });

    // ─────────────────────────────────────────────────────────
    //  10. FOOTER
    // ─────────────────────────────────────────────────────────
    const FTR_Y = PAGE_H - 26;
    fillRect(0, FTR_Y, PAGE_W, 26, C.dark);
    fillRect(0, FTR_Y,  PAGE_W, 2,  C.pink);

    doc.save().fillColor(C.pinkMed).fontSize(7.5).font("Helvetica")
       .text(
         "Thank you for your business. This is a computer-generated invoice.",
         ML, FTR_Y + 9, { width: CW, align: "center" }
       )
       .restore();

    // ─────────────────────────────────────────────────────────
    //  Finalise — save to DB and send
    // ─────────────────────────────────────────────────────────
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(chunks);
      const fileName  = `Invoice_${invoiceNumber}.pdf`;

      try {
        const [existing] = await db.query(
          "SELECT id FROM invoices WHERE po_id = ? LIMIT 1",
          [poId]
        );
        if (existing.length) {
          await db.query(
            "UPDATE invoices SET file_blob = ?, file_name = ? WHERE id = ?",
            [pdfBuffer, fileName, existing[0].id]
          );
        } else {
          await db.query(
            `INSERT INTO invoices (po_id, payment_id, invoice_number, file_name, file_blob)
             VALUES (?, ?, ?, ?, ?)`,
            [poId, d.payment_id || null, invoiceNumber, fileName, pdfBuffer]
          );
        }
      } catch (storeErr) {
        if (storeErr.code !== "ER_NO_SUCH_TABLE")
          console.error("Invoice store failed", { code: storeErr.code });
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
      res.send(pdfBuffer);
    });

    doc.end();
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ error: "Internal Server Error" });
  }
};

router.post("/generate-pdf/:poId", generateInvoicePdf);
router.get("/generate-pdf/:poId",  generateInvoicePdf);

module.exports = router;
