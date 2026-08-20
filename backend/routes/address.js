const express = require("express");
const db = require("../db");
const authenticate = require("../utils/auth");
const { requireFields } = require("../utils/validation");

const router = express.Router();

router.use(authenticate);

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, user_id, name, phone, address_line, city, state, pincode, created_at, updated_at
       FROM user_addresses
       WHERE user_id = ?
       ORDER BY id DESC`,
      [req.user.id]
    );
    res.json({ addresses: rows });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", async (req, res) => {
  const { name, phone, address_line, city, state, pincode } = req.body;

  if (
    !requireFields(res, {
      name,
      phone,
      address_line,
      city,
      state,
      pincode,
    })
  ) {
    return;
  }

  try {
    const [result] = await db.query(
      `INSERT INTO user_addresses
        (user_id, name, phone, address_line, city, state, pincode, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [req.user.id, name, phone, address_line, city, state, pincode]
    );

    if (!result.affectedRows) {
      return res.status(500).json({ message: "Failed to create address" });
    }

    const [rows] = await db.query(
      `SELECT id, user_id, name, phone, address_line, city, state, pincode, created_at, updated_at
       FROM user_addresses
       WHERE id = ? AND user_id = ?`,
      [result.insertId, req.user.id]
    );

    res.status(201).json({ address: rows[0] });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, phone, address_line, city, state, pincode } = req.body;

  if (
    !requireFields(res, {
      id,
      name,
      phone,
      address_line,
      city,
      state,
      pincode,
    })
  ) {
    return;
  }

  try {
    const [result] = await db.query(
      `UPDATE user_addresses
       SET name = ?, phone = ?, address_line = ?, city = ?, state = ?, pincode = ?, updated_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [name, phone, address_line, city, state, pincode, id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Address not found" });
    }

    const [rows] = await db.query(
      `SELECT id, user_id, name, phone, address_line, city, state, pincode, created_at, updated_at
       FROM user_addresses
       WHERE id = ? AND user_id = ?`,
      [id, req.user.id]
    );

    res.json({ address: rows[0] });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query(
      "DELETE FROM user_addresses WHERE id = ? AND user_id = ?",
      [id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;


