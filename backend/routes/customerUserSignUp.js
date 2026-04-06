const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { requireFields } = require("../utils/validation");
const router = express.Router();

// Create customer user (no adminID required anymore)
router.post("/customerUser", async (req, res) => {
  try {
    const { personName, contactNumber, Email, password } = req.body;

    if (!personName || !contactNumber || !Email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [rows] = await db.query(
      "SELECT * FROM customerusersignup WHERE Email = ?",
      [Email]
    );

    if (rows.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [insertResult] = await db.query(
      `INSERT INTO customerusersignup (personName, contactNumber, Email, password)
       VALUES (?, ?, ?, ?)`,
      [personName, contactNumber, Email, hashedPassword]
    );
    if (!insertResult.affectedRows) {
      return res.status(500).json({ message: "Failed to register user" });
    }

    return res.status(200).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    return res.status(500).json({ message: "Server error" });
  }
});

// Get all customer users
router.get("/all-users", async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT id, personName, Email, contactNumber, status, created_at AS createdAt
       FROM customerusersignup
       ORDER BY created_at DESC`
    );
    res.status(200).json(users);
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete user
router.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!requireFields(res, { id })) {
      return;
    }

    const [deleteResult] = await db.query(
      "DELETE FROM customerusersignup WHERE id = ?",
      [id]
    );
    if (!deleteResult.affectedRows) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Failed to delete user" });
  }
});

// Edit user
router.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { personName, Email, contactNumber, status } = req.body;

    if (
      !requireFields(res, {
        id,
        personName,
        Email,
        contactNumber,
        status,
      })
    ) {
      return;
    }

    const [existingUser] = await db.query(
      "SELECT * FROM customerusersignup WHERE Email = ? AND id != ?",
      [Email, id]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email already in use by another user" });
    }

    const [updateResult] = await db.query(
      `UPDATE customerusersignup
       SET personName = ?, Email = ?, contactNumber = ?, status = ?, updated_at = NOW()
       WHERE id = ?`,
      [personName, Email, contactNumber, status, id]
    );
    if (!updateResult.affectedRows) {
      return res.status(404).json({ message: "User not found" });
    }

    const [updatedUser] = await db.query(
      "SELECT * FROM customerusersignup WHERE id = ?",
      [id]
    );

    if (updatedUser.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully", user: updatedUser[0] });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Server error while updating user" });
  }
});

// Get single user by ID
router.get("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(
      "SELECT id, personName, Email, contactNumber, status, created_at FROM customerusersignup WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update customer profile (self-update)
router.put("/update-profile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { personName, contactNumber, Email } = req.body;

    if (
      !requireFields(res, {
        id,
        personName,
        contactNumber,
        Email,
      })
    ) {
      return;
    }

    const [updateResult] = await db.query(
      `UPDATE customerusersignup
       SET personName = ?, contactNumber = ?, Email = ?, updated_at = NOW()
       WHERE id = ?`,
      [personName, contactNumber, Email, id]
    );
    if (!updateResult.affectedRows) {
      return res.status(404).json({ message: "User not found" });
    }

    const [updated] = await db.query(
      "SELECT * FROM customerusersignup WHERE id = ?",
      [id]
    );

    res.status(200).json({ message: "Profile updated successfully", user: updated[0] });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

