const db = require("../db");
const { v4: uuidv4 } = require("uuid");
const { requireFields } = require("../utils/validation");
const { createOrder, verifySignature } = require("../services/razorpayService");

const normalizeItems = (items) => (Array.isArray(items) ? items : []);

const normalizeShipToAddress = (address) => {
  if (!address) return null;
  if (typeof address === "string") {
    const trimmed = address.trim();
    return trimmed ? { address: trimmed } : null;
  }

  const resolvedAddress =
    address.address || address.address_line || address.addressLine || "";
  const resolvedPostal =
    address.postalCode ||
    address.postal_code ||
    address.pincode ||
    address.zip ||
    address.zipCode ||
    "";

  return {
    address: resolvedAddress,
    city: address.city || "",
    state: address.state || "",
    country: address.country || "",
    postalCode: resolvedPostal,
  };
};

const formatSqlDateTime = (value, endOfDay = false) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  if (endOfDay) {
    parsed.setHours(23, 59, 59, 999);
  } else {
    parsed.setHours(0, 0, 0, 0);
  }
  return parsed.toISOString().slice(0, 19).replace("T", " ");
};

const safeJsonParse = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const computeOrderTotals = async (items) => {
  const productIds = Array.from(
    new Set(items.map((item) => Number(item.productId)).filter(Boolean))
  );

  if (!productIds.length) {
    return { error: "No valid products provided" };
  }

  const placeholders = productIds.map(() => "?").join(",");
  const [rows] = await db.query(
    `SELECT id, price FROM products WHERE id IN (${placeholders})`,
    productIds
  );
  const priceMap = new Map(rows.map((row) => [Number(row.id), Number(row.price)]));

  const normalized = [];
  let total = 0;

  for (const item of items) {
    const productId = Number(item.productId);
    const quantity = Number(item.quantity);
    if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
      return { error: "Invalid item details" };
    }
    const unitPrice = priceMap.get(productId);
    if (!Number.isFinite(unitPrice)) {
      return { error: "Product not found" };
    }
    const totalPrice = unitPrice * quantity;
    total += totalPrice;
    normalized.push({
      productId,
      quantity,
      size: item.size ? String(item.size).trim() : null,
      unitPrice,
      totalPrice,
      cartId: item.cartId ? Number(item.cartId) : null,
    });
  }

  return { total, items: normalized };
};

const createPaymentOrder = async (req, res) => {
  try {
    const {
      amount,
      currency = "INR",
      receipt,
      notes,
      customerId,
      items,
      shipToAddress,
    } = req.body;

    const resolvedCustomerId = Number(req.user?.id || customerId);
    if (!resolvedCustomerId) {
      return res.status(400).json({ message: "Customer is required" });
    }
    if (customerId && Number(customerId) !== resolvedCustomerId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const normalizedItems = normalizeItems(items);
    let totalAmount = null;
    let paymentItems = [];

    if (normalizedItems.length) {
      const computed = await computeOrderTotals(normalizedItems);
      if (computed.error) {
        return res.status(400).json({ message: computed.error });
      }
      totalAmount = computed.total;
      paymentItems = computed.items;
    } else {
      const numericAmount = Number(amount);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      totalAmount = numericAmount;
    }

    const amountInPaise = Math.round(totalAmount * 100);
    const order = await createOrder({
      amountInPaise,
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes || {},
    });

    const payload = {
      items: normalizedItems,
      shipToAddress: normalizeShipToAddress(shipToAddress),
    };

    try {
      await db.query("START TRANSACTION");

      const [paymentResult] = await db.query(
        `INSERT INTO payments
          (customer_id, razorpay_order_id, amount, currency, status, receipt, order_payload_json)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          resolvedCustomerId,
          order.id,
          totalAmount,
          currency,
          "created",
          order.receipt,
          JSON.stringify(payload),
        ]
      );

      if (!paymentResult.affectedRows) {
        await db.query("ROLLBACK");
        return res.status(500).json({ message: "Failed to create payment record" });
      }

      const paymentId = paymentResult.insertId;
      if (paymentItems.length) {
        const values = paymentItems.map(() => "(?, ?, ?, ?, ?, ?, ?)").join(",");
        const params = paymentItems.flatMap((item) => [
          paymentId,
          item.productId,
          item.quantity,
          item.size,
          item.unitPrice,
          item.totalPrice,
          item.cartId,
        ]);
        const [itemsResult] = await db.query(
          `INSERT INTO payment_items
            (payment_id, product_id, quantity, size, unit_price, total_price, cart_id)
           VALUES ${values}`,
          params
        );
        if (!itemsResult.affectedRows) {
          await db.query("ROLLBACK");
          return res.status(500).json({ message: "Failed to create payment items" });
        }
      }

      await db.query("COMMIT");
    } catch (dbError) {
      await db.query("ROLLBACK");
      console.error("Payment record error", { code: dbError.code, errno: dbError.errno });
      return res.status(500).json({ message: "Failed to create payment record" });
    }

    return res.status(201).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Payment order error", { code: error.code, errno: error.errno });
    if (error.message === "Razorpay keys are not configured.") {
      return res.status(500).json({ message: "Razorpay keys are not configured" });
    }
    return res.status(500).json({ message: "Failed to create payment order" });
  }
};

const createOrderForItem = async ({ customerId, shipToAddress, item, paymentId }) => {
  const normalizedShipToAddress = normalizeShipToAddress(shipToAddress);
  const [customer] = await db.query(
    `SELECT id, personName, Email
     FROM customerusersignup
     WHERE id = ?`,
    [customerId]
  );

  if (!customer.length) {
    throw new Error("Customer not found");
  }

  const [product] = await db.query(
    `SELECT 
      p.id AS product_id,
      p.productName,
      p.price,
      p.vendor_id,
      p.description,
      p.category,
      v.personName AS vendorName,
      v.Email AS vendorEmail
     FROM products p
     LEFT JOIN vendorusersignup v ON p.vendor_id = v.id
     WHERE p.id = ?`,
    [item.productId]
  );

  if (!product.length) {
    throw new Error("Product not found");
  }

  const productData = product[0];
  const vendorName = productData.vendorName || "N/A";
  const vendorCompany = productData.vendorName || "N/A";
  const vendorEmail = productData.vendorEmail || "N/A";
  const totalAmount = item.totalPrice;
  const customerCompany = customer[0].personName || "N/A";
  const poNumber = `PO-${new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")}-${uuidv4().slice(0, 4).toUpperCase()}`;

  const deliveryNotes = item.size
    ? `Delivery as soon as possible | Size: ${item.size}`
    : "Delivery as soon as possible";

  const [poResult] = await db.query(
    `INSERT INTO purchase_orders 
      (po_number, customer_id, customer_name, customer_company,
       customer_address, customer_city, customer_state, customer_country, customer_postal_code,
       customer_gst_number, customer_company_registrationNo,
       ship_to_address, ship_to_city, ship_to_state, ship_to_country, ship_to_postal_code,
       total_amount, customer_email, delivery_notes, payment_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      poNumber,
      customerId,
      customer[0].personName,
      customerCompany,
      normalizedShipToAddress?.address || "N/A",
      normalizedShipToAddress?.city || "N/A",
      normalizedShipToAddress?.state || "N/A",
      normalizedShipToAddress?.country || "N/A",
      normalizedShipToAddress?.postalCode || "N/A",
      "N/A",
      "N/A",
      normalizedShipToAddress?.address || "N/A",
      normalizedShipToAddress?.city || "N/A",
      normalizedShipToAddress?.state || "N/A",
      normalizedShipToAddress?.country || "N/A",
      normalizedShipToAddress?.postalCode || "N/A",
      totalAmount,
      customer[0].Email,
      deliveryNotes,
      paymentId,
    ]
  );

  if (!poResult.affectedRows) {
    throw new Error("Failed to create purchase order");
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
      vendorName,
      vendorCompany,
      "N/A",
      "N/A",
      "N/A",
      "N/A",
      "N/A",
      "N/A",
      item.quantity,
      item.unitPrice,
      item.totalPrice,
      vendorEmail,
    ]
  );

  if (!itemResult.affectedRows) {
    throw new Error("Failed to create purchase order items");
  }

  return poId;
};

const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = req.body;

    if (!requireFields(res, { orderId, paymentId, signature })) {
      return;
    }

    const [payments] = await db.query(
      `SELECT id, customer_id, status, order_payload_json, order_ids_json
       FROM payments
       WHERE razorpay_order_id = ?`,
      [orderId]
    );

    if (!payments.length) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const payment = payments[0];
    if (payment.status === "verified") {
      const existingOrders = payment.order_ids_json
        ? JSON.parse(payment.order_ids_json)
        : [];
      return res.status(200).json({
        status: "verified",
        idempotent: true,
        orderId,
        paymentId,
        orderIds: existingOrders,
      });
    }

    const isValid = verifySignature({ orderId, paymentId, signature });
    if (!isValid) {
      await db.query(
        "UPDATE payments SET status = ?, razorpay_payment_id = ?, razorpay_signature = ? WHERE id = ?",
        ["failed", paymentId, signature, payment.id]
      );
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const payload = payment.order_payload_json
      ? JSON.parse(payment.order_payload_json)
      : { items: [], shipToAddress: null };

    const [paymentItems] = await db.query(
      `SELECT product_id, quantity, size, unit_price, total_price, cart_id
       FROM payment_items
       WHERE payment_id = ?`,
      [payment.id]
    );

    if (!paymentItems.length) {
      return res.status(400).json({ message: "No items found for payment" });
    }

    try {
      await db.query("START TRANSACTION");

      await db.query(
        `UPDATE payments
         SET status = ?, razorpay_payment_id = ?, razorpay_signature = ?, verified_at = NOW()
         WHERE id = ?`,
        ["verified", paymentId, signature, payment.id]
      );

      const orderIds = [];
      for (const item of paymentItems) {
        const poId = await createOrderForItem({
          customerId: payment.customer_id,
          shipToAddress: payload.shipToAddress || null,
          item: {
            productId: item.product_id,
            quantity: item.quantity,
            size: item.size,
            unitPrice: Number(item.unit_price),
            totalPrice: Number(item.total_price),
          },
          paymentId: payment.id,
        });
        orderIds.push(poId);
      }

      if (orderIds.length) {
        await db.query(
          "UPDATE payments SET order_ids_json = ? WHERE id = ?",
          [JSON.stringify(orderIds), payment.id]
        );
      }

      const cartIds = paymentItems
        .map((item) => Number(item.cart_id))
        .filter((id) => Number.isFinite(id));

      if (cartIds.length) {
        const placeholders = cartIds.map(() => "?").join(",");
        await db.query(
          `DELETE FROM cart WHERE id IN (${placeholders}) AND customer_id = ?`,
          [...cartIds, payment.customer_id]
        );
      }

      await db.query("COMMIT");

      return res.status(200).json({
        status: "verified",
        orderId,
        paymentId,
        orderIds,
      });
    } catch (dbError) {
      await db.query("ROLLBACK");
      console.error("Payment verification error", {
        code: dbError.code,
        errno: dbError.errno,
        message: dbError.message,
      });
      return res.status(500).json({
        message: "Failed to finalize order",
        details: dbError.sqlMessage || dbError.message || "Unknown error",
      });
    }
  } catch (error) {
    console.error("Payment verification error", { code: error.code, errno: error.errno });
    return res.status(500).json({ message: "Failed to verify payment" });
  }
};

const getPaymentStatus = async (req, res) => {
  const { orderId } = req.params;
  if (!orderId) {
    return res.status(400).json({ message: "Order ID is required" });
  }

  try {
    const [rows] = await db.query(
      `SELECT razorpay_order_id, razorpay_payment_id, amount, currency, status, receipt, created_at, verified_at
       FROM payments WHERE razorpay_order_id = ?`,
      [orderId]
    );
    if (!rows.length) {
      return res.status(404).json({ message: "Payment not found" });
    }
    return res.json(rows[0]);
  } catch (error) {
    console.error("Payment status error", { code: error.code, errno: error.errno });
    return res.status(500).json({ message: "Failed to fetch payment status" });
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const customerId = Number(req.user?.id);
    if (!customerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(
      50,
      Math.max(5, Number.parseInt(req.query.pageSize, 10) || 10)
    );
    const offset = (page - 1) * pageSize;

    const filters = ["p.customer_id = ?"];
    const params = [customerId];

    const statusRaw = String(req.query.status || "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter((status) => status && status !== "all");

    if (statusRaw.length) {
      const placeholders = statusRaw.map(() => "?").join(",");
      filters.push(`p.status IN (${placeholders})`);
      params.push(...statusRaw);
    }

    const fromDate = formatSqlDateTime(req.query.from, false);
    if (fromDate) {
      filters.push("p.created_at >= ?");
      params.push(fromDate);
    }

    const toDate = formatSqlDateTime(req.query.to, true);
    if (toDate) {
      filters.push("p.created_at <= ?");
      params.push(toDate);
    }

    const search = String(req.query.search || "").trim();
    if (search) {
      const like = `%${search}%`;
      filters.push(
        `(
          p.razorpay_order_id LIKE ?
          OR p.razorpay_payment_id LIKE ?
          OR p.receipt LIKE ?
          OR CAST(p.id AS CHAR) LIKE ?
          OR cu.personName LIKE ?
          OR EXISTS (
            SELECT 1 FROM purchase_orders po
            WHERE po.payment_id = p.id AND po.po_number LIKE ?
          )
          OR EXISTS (
            SELECT 1 FROM purchase_orders po
            JOIN purchase_order_items poi ON poi.po_id = po.id
            WHERE po.payment_id = p.id AND poi.product_name LIKE ?
          )
        )`
      );
      params.push(like, like, like, like, like, like, like);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total
       FROM payments p
       LEFT JOIN customerusersignup cu ON cu.id = p.customer_id
       ${whereClause}`,
      params
    );
    const total = Number(countRows[0]?.total || 0);
    const totalPages = total ? Math.ceil(total / pageSize) : 0;

    const [rows] = await db.query(
      `SELECT p.id, p.customer_id, p.razorpay_order_id, p.razorpay_payment_id, p.amount, p.currency, p.status,
              p.receipt, p.order_ids_json, p.order_payload_json, p.created_at, p.verified_at,
              cu.personName, cu.Email
       FROM payments p
       LEFT JOIN customerusersignup cu ON cu.id = p.customer_id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    );

    const [statsRows] = await db.query(
      `SELECT p.status, COUNT(*) AS count, SUM(p.amount) AS total_amount
       FROM payments p
       LEFT JOIN customerusersignup cu ON cu.id = p.customer_id
       ${whereClause}
       GROUP BY p.status`,
      params
    );

    const statsByStatus = statsRows.reduce((acc, row) => {
      acc[row.status] = {
        count: Number(row.count || 0),
        amount: Number(row.total_amount || 0),
      };
      return acc;
    }, {});

    const payments = rows.map((row) => ({
      ...row,
      order_ids: safeJsonParse(row.order_ids_json, []),
      order_payload: safeJsonParse(row.order_payload_json, null),
      customer_name: row.personName || "",
      customer_email: row.Email || "",
    }));

    return res.json({
      payments,
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
      stats: {
        total,
        byStatus: statsByStatus,
      },
    });
  } catch (error) {
    console.error("Payment history error", { code: error.code, errno: error.errno });
    return res.status(500).json({ message: "Failed to fetch payment history" });
  }
};

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getPaymentStatus,
  getPaymentHistory,
};
