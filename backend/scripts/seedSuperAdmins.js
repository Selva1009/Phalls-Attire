require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const bcrypt = require("bcryptjs");
const db = require("../db");

const requiredEnv = [
  "SUPER_ADMIN_1_EMAIL",
  "SUPER_ADMIN_1_PASSWORD",
  "SUPER_ADMIN_1_PERSON_NAME",
];

const ensureColumn = async (table, column, definition) => {
  const [columns] = await db.query(
    `SELECT COUNT(*) AS count
     FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column]
  );
  if (!Number(columns[0]?.count)) {
    await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }
};

const ensureStoreSchema = async () => {
  await ensureColumn("vendorusersignup", "role", "VARCHAR(32) NULL");
  await ensureColumn("products", "subcategory", "VARCHAR(255) NULL");
  await ensureColumn("products", "mrp", "DECIMAL(10,2) NULL");
  await ensureColumn("products", "selling_price", "DECIMAL(10,2) NULL");
  await ensureColumn("products", "discount_type", "VARCHAR(20) NULL");
  await ensureColumn("products", "discount_value", "DECIMAL(10,2) NULL");
  await ensureColumn("products", "final_price", "DECIMAL(10,2) NULL");
  await ensureColumn("products", "stock", "INT NULL");
  await ensureColumn("products", "product_images", "TEXT NULL");
  await ensureColumn("products", "sizes", "TEXT NULL");
  await ensureColumn("products", "status", "VARCHAR(20) NULL");
  await ensureColumn("cart", "size", "VARCHAR(16) NULL");
};

const seedAdmin = async (email, password, personName) => {
  const [rows] = await db.query(
    "SELECT id FROM vendorusersignup WHERE Email = ? LIMIT 1",
    [email]
  );
  const passwordHash = await bcrypt.hash(password, 10);

  if (rows.length) {
    await db.query(
      `UPDATE vendorusersignup
       SET role = 'SUPER_ADMIN', password = ?, companyName = ?, personName = ?
       WHERE id = ?`,
      [passwordHash, "Phalls Attire", personName, rows[0].id]
    );
    return rows[0].id;
  }

  const [result] = await db.query(
    `INSERT INTO vendorusersignup
      (companyName, personName, phoneNumber, Email, password, role)
     VALUES (?, ?, ?, ?, ?, 'SUPER_ADMIN')`,
    ["Phalls Attire", personName, "", email, passwordHash]
  );
  return result.insertId;
};

const main = async () => {
  const missing = requiredEnv.filter((name) => !String(process.env[name] || "").trim());
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const email = process.env.SUPER_ADMIN_1_EMAIL.trim();

  await ensureStoreSchema();
  await seedAdmin(
    email,
    process.env.SUPER_ADMIN_1_PASSWORD,
    process.env.SUPER_ADMIN_1_PERSON_NAME.trim()
  );
  console.log("Super admin seed complete. Account ensured: 1");
};

main()
  .catch((error) => {
    console.error("Super admin seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });
