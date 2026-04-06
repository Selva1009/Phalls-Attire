const express = require("express");
const db = require("../db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const fsp = require("fs").promises;
const XLSX = require("xlsx");
const { v4: uuidv4 } = require("uuid");
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
    cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });
const uploadBulk = multer({ storage });

const bulkJobStore = new Map();
const bulkJobQueue = [];
let bulkJobRunning = false;

const enqueueBulkJob = ({ vendor_user_id, bulkFile, imageFiles }) => {
  const jobId = uuidv4();
  bulkJobStore.set(jobId, {
    id: jobId,
    state: "queued",
    insertedCount: 0,
    failedCount: 0,
    errors: [],
    totalRows: 0,
    processedRows: 0,
    startedAt: null,
    finishedAt: null,
    error: null,
  });
  bulkJobQueue.push({ jobId, vendor_user_id, bulkFile, imageFiles });
  setImmediate(runNextBulkJob);
  return jobId;
};

const runNextBulkJob = async () => {
  if (bulkJobRunning) return;
  const next = bulkJobQueue.shift();
  if (!next) return;

  bulkJobRunning = true;
  const { jobId, vendor_user_id, bulkFile, imageFiles } = next;
  const status = bulkJobStore.get(jobId);
  if (!status) {
    bulkJobRunning = false;
    setImmediate(runNextBulkJob);
    return;
  }

  status.state = "processing";
  status.startedAt = new Date().toISOString();
  console.info(`[bulk-upload:${jobId}] started`);

  try {
    const result = await processBulkUpload({
      vendor_user_id,
      bulkFile,
      imageFiles,
      jobId,
    });
    status.state = "completed";
    status.insertedCount = result.insertedCount;
    status.failedCount = result.errors.length;
    status.errors = result.errors;
    status.totalRows = result.totalRows;
    status.processedRows = result.processedRows;
    status.finishedAt = new Date().toISOString();
    console.info(
      `[bulk-upload:${jobId}] completed inserted=${status.insertedCount} failed=${status.failedCount}`
    );
  } catch (error) {
    status.state = "failed";
    status.error = error.message || "Server error";
    status.finishedAt = new Date().toISOString();
    console.error(`[bulk-upload:${jobId}] failed`, {
      code: error.code,
      errno: error.errno,
    });
  } finally {
    bulkJobRunning = false;
    setImmediate(runNextBulkJob);
  }
};

const processBulkUpload = async ({ vendor_user_id, bulkFile, imageFiles, jobId }) => {
  const logPrefix = jobId ? `[bulk-upload:${jobId}]` : "[bulk-upload]";

  const [userResult] = await db.query(
    "SELECT companyName FROM vendorusersignup WHERE id = ?",
    [vendor_user_id]
  );

  if (userResult.length === 0) {
    throw new Error("Vendor user not found.");
  }

  const companyName = userResult[0].companyName;
  const rows = parseBulkFile(bulkFile.path);

  if (!rows.length) {
    throw new Error("No data rows found in file.");
  }

  console.info(`${logPrefix} parsed rows=${rows.length}`);

  const imageMap = new Map();
  imageFiles.forEach((file) => {
    imageMap.set(file.originalname.trim().toLowerCase(), file.filename);
  });

  const errors = [];
  let insertedCount = 0;
  let processedRows = 0;
  const validRows = [];

  for (let i = 0; i < rows.length; i += 1) {
    const rawRow = rows[i];
    const rowIndex = i + 2; // 1-based with header row
    const data = canonicalizeRow(rawRow);

    const missingFields = [];
    if (!data.productName) missingFields.push("productName");
    if (!data.brand) missingFields.push("brand");
    if (!data.category) missingFields.push("category");
    if (!data.price && data.price !== 0) missingFields.push("price");
    if (!data.hsn_code) missingFields.push("hsn_code");
    if (!data.stock_status) missingFields.push("stock_status");
    if (!data.description) missingFields.push("description");
    if (!data.productImage) missingFields.push("productImage");

    if (missingFields.length) {
      errors.push({
        row: rowIndex,
        reason: `Missing fields: ${missingFields.join(", ")}`,
        productName: data.productName || "",
      });
      processedRows += 1;
      continue;
    }

    const imageKey = path.basename(data.productImage).trim().toLowerCase();
    const storedImage = imageMap.get(imageKey);

    if (!storedImage) {
      errors.push({
        row: rowIndex,
        reason: `Image not uploaded or filename mismatch: ${data.productImage}`,
        productName: data.productName,
      });
      processedRows += 1;
      continue;
    }

    const priceValue = Number(data.price);
    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      errors.push({
        row: rowIndex,
        reason: `Invalid price: ${data.price}`,
        productName: data.productName,
      });
      processedRows += 1;
      continue;
    }

    validRows.push({
      rowIndex,
      data,
      storedImage,
      priceValue,
    });
  }

  console.info(
    `${logPrefix} validated rows=${rows.length} valid=${validRows.length} invalid=${errors.length}`
  );

  const chunkSize = 200;
  for (let i = 0; i < validRows.length; i += chunkSize) {
    const chunk = validRows.slice(i, i + chunkSize);
    const values = chunk.map((item) => [
      vendor_user_id,
      item.data.productName,
      item.data.brand,
      item.data.category,
      item.priceValue,
      companyName,
      item.storedImage,
      item.data.description,
      item.data.hsn_code || null,
      item.data.stock_status || null,
    ]);

    try {
      const [insertResult] = await db.query(
        `INSERT INTO products (vendor_id, productName, brand, category, price, seller, productImage, description, hsn_code, stock_status)
         VALUES ?`,
        [values]
      );
      insertedCount += insertResult.affectedRows || 0;
      processedRows += chunk.length;
      console.info(
        `${logPrefix} inserted chunk ${i + 1}-${i + chunk.length} total=${insertedCount}`
      );
    } catch (error) {
      console.error(`${logPrefix} bulk insert error`, {
        code: error.code,
        errno: error.errno,
      });
      for (const item of chunk) {
        try {
          const [singleResult] = await db.query(
            `INSERT INTO products (vendor_id, productName, brand, category, price, seller, productImage, description, hsn_code, stock_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              vendor_user_id,
              item.data.productName,
              item.data.brand,
              item.data.category,
              item.priceValue,
              companyName,
              item.storedImage,
              item.data.description,
              item.data.hsn_code || null,
              item.data.stock_status || null,
            ]
          );
          if (singleResult.affectedRows) {
            insertedCount += 1;
          } else {
            errors.push({
              row: item.rowIndex,
              reason: "Failed to insert product",
              productName: item.data.productName,
            });
          }
        } catch (singleError) {
          console.error(`${logPrefix} fallback insert error`, {
            code: singleError.code,
            errno: singleError.errno,
          });
          errors.push({
            row: item.rowIndex,
            reason: "Server error while inserting product",
            productName: item.data.productName,
          });
        } finally {
          processedRows += 1;
        }
      }
    }
  }

  try {
    await fsp.unlink(bulkFile.path);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(`${logPrefix} error deleting bulk file`, {
        code: error.code,
        errno: error.errno,
      });
    }
  }

  return {
    insertedCount,
    errors,
    totalRows: rows.length,
    processedRows,
  };
};

const normalizeHeader = (header = "") =>
  header
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

const getCellValue = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return value;
  return value.toString().trim();
};

const canonicalizeRow = (row) => {
  const normalized = {};
  Object.keys(row || {}).forEach((key) => {
    const normalizedKey = normalizeHeader(key);
    normalized[normalizedKey] = getCellValue(row[key]);
  });

  return {
    productName:
      normalized.productname ||
      normalized.product_name ||
      normalized.product ||
      "",
    brand: normalized.brand || normalized.make_model || normalized.make || "",
    category: normalized.category || normalized.product_category || "",
    price: normalized.price || normalized.product_price || "",
    hsn_code: normalized.hsn_code || normalized.hsn || "",
    stock_status:
      normalized.stock_status ||
      normalized.stock ||
      normalized.stockstatus ||
      "",
    description:
      normalized.description ||
      normalized.product_description ||
      "",
    productImage:
      normalized.productimage ||
      normalized.product_image ||
      normalized.image ||
      normalized.image_name ||
      ""
  };
};

const parseBulkFile = (filePath) => {
  const workbook = XLSX.readFile(filePath, { raw: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return [];
  }
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
};

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

// Bulk Upload Products (CSV/XLSX + images)
router.post(
  "/bulk-upload",
  uploadBulk.fields([
    { name: "file", maxCount: 1 },
    { name: "images", maxCount: 200 },
  ]),
  async (req, res) => {
    const { vendor_user_id } = req.body;

    if (!requireFields(res, { vendor_user_id })) {
      return;
    }

    const bulkFile = req.files?.file?.[0];
    if (!bulkFile) {
      return res.status(400).json({ message: "Bulk file is required." });
    }

    const ext = path.extname(bulkFile.originalname || "").toLowerCase();
    if (ext !== ".csv" && ext !== ".xlsx") {
      return res.status(400).json({ message: "Only CSV or XLSX files are supported." });
    }

    try {
      const imageFiles = req.files?.images || [];
      const result = await processBulkUpload({
        vendor_user_id,
        bulkFile,
        imageFiles,
      });

      return res.status(201).json({
        message: "Bulk upload processed",
        insertedCount: result.insertedCount,
        failedCount: result.errors.length,
        errors: result.errors,
      });
    } catch (error) {
      const message =
        error.message === "Vendor user not found."
          ? "Vendor user not found."
          : error.message === "No data rows found in file."
          ? "No data rows found in file."
          : "Server error";
      const status = message === "Vendor user not found." ? 404 : message === "No data rows found in file." ? 400 : 500;
      console.error("Bulk upload server error", { code: error.code, errno: error.errno });
      return res.status(status).json({ message });
    }
  }
);

// Bulk Upload Products (Async)
router.post(
  "/bulk-upload-async",
  uploadBulk.fields([
    { name: "file", maxCount: 1 },
    { name: "images", maxCount: 200 },
  ]),
  async (req, res) => {
    const { vendor_user_id } = req.body;

    if (!requireFields(res, { vendor_user_id })) {
      return;
    }

    const bulkFile = req.files?.file?.[0];
    if (!bulkFile) {
      return res.status(400).json({ message: "Bulk file is required." });
    }

    const ext = path.extname(bulkFile.originalname || "").toLowerCase();
    if (ext !== ".csv" && ext !== ".xlsx") {
      return res.status(400).json({ message: "Only CSV or XLSX files are supported." });
    }

    const imageFiles = (req.files?.images || []).map((file) => ({
      originalname: file.originalname,
      filename: file.filename,
    }));

    const jobId = enqueueBulkJob({
      vendor_user_id,
      bulkFile: {
        path: bulkFile.path,
        originalname: bulkFile.originalname,
      },
      imageFiles,
    });

    return res.status(202).json({
      message: "Bulk upload queued",
      jobId,
    });
  }
);

// Bulk upload job status
router.get("/bulk-upload-status/:jobId", (req, res) => {
  const { jobId } = req.params;
  const status = bulkJobStore.get(jobId);
  if (!status) {
    return res.status(404).json({ message: "Job not found." });
  }
  return res.status(200).json({
    jobId: status.id,
    state: status.state,
    insertedCount: status.insertedCount,
    failedCount: status.failedCount,
    totalRows: status.totalRows,
    processedRows: status.processedRows,
    startedAt: status.startedAt,
    finishedAt: status.finishedAt,
    error: status.error,
    errors: status.errors,
  });
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

// Delete Product (hard delete)
router.delete("/delete-product/:id", async (req, res) => {
  try {
    if (!requireFields(res, { id: req.params.id })) {
      return;
    }

    const [existingProduct] = await db.query(
      "SELECT productImage FROM products WHERE id = ?",
      [req.params.id]
    );

    if (existingProduct.length === 0) {
      return res.status(404).json({ message: "Product not found!" });
    }

    const productImage = existingProduct[0].productImage;
    const imagePath = productImage ? path.join("uploads", productImage) : null;

    try {
      await db.query("START TRANSACTION");

      // Remove dependent records to satisfy FK constraints
      await db.query("DELETE FROM cart WHERE product_id = ?", [req.params.id]);
      await db.query("DELETE FROM user_favourites WHERE product_id = ?", [req.params.id]);
      await db.query("DELETE FROM notifications WHERE product_id = ?", [req.params.id]);
      await db.query("DELETE FROM payment_items WHERE product_id = ?", [req.params.id]);
      await db.query("DELETE FROM purchase_order_items WHERE product_id = ?", [req.params.id]);

      const [deleteResult] = await db.execute(
        "DELETE FROM products WHERE id = ?",
        [req.params.id]
      );
      if (!deleteResult.affectedRows) {
        await db.query("ROLLBACK");
        return res.status(500).json({ message: "Failed to delete product" });
      }

      await db.query("COMMIT");
    } catch (error) {
      await db.query("ROLLBACK");
      console.error("Server error", { code: error.code, errno: error.errno });
      return res.status(500).json({ message: "Internal Server Error" });
    }

    if (imagePath) {
      try {
        await fsp.unlink(imagePath);
      } catch (error) {
        if (error.code !== "ENOENT") {
          console.error("Image delete error", { code: error.code, errno: error.errno });
        }
      }
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
