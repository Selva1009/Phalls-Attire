const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const authenticate = require("../utils/auth");

const router = express.Router();

router.put("/change-password", authenticate, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: "Both old and new passwords are required" });
  }

  try {
    const [rows] = await db.query(
      "SELECT password FROM customerusersignup WHERE id = ?",
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const [updateResult] = await db.query(
      "UPDATE customerusersignup SET password = ?, updated_at = NOW() WHERE id = ?",
      [hashedPassword, req.user.id]
    );
    if (!updateResult.affectedRows) {
      return res.status(500).json({ message: "Failed to update password" });
    }

    res.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;


