const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { sendOTP } = require("../utils/mailer");

const router = express.Router();
let otpStore = {};

// Send OTP
router.post("/customer-sendotp", async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: "Email is required" });

  const otp = Math.floor(1000 + Math.random() * 9000);

  try {
    await sendOTP(email, otp);
    otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };
    console.log(`Generated OTP for ${email}: ${otp}`);
    res.json({ success: true, message: "OTP sent successfully!" });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// Customer Signup — directly into customerusersignup
router.post("/customer-signup", async (req, res) => {
  try {
    const { personName, contactNumber, Email, otp, password } = req.body;

    if (!personName || !contactNumber || !Email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!/^\d{10}$/.test(String(contactNumber))) {
      return res.status(400).json({ message: "Enter a valid 10-digit mobile number" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(Email))) {
      return res.status(400).json({ message: "Enter a valid email" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const [existing] = await db.query(
      "SELECT * FROM customerusersignup WHERE Email = ?",
      [Email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    if (otp) {
      delete otpStore[Email];
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [insertResult] = await db.query(
      `INSERT INTO customerusersignup (personName, contactNumber, Email, password)
       VALUES (?, ?, ?, ?)`,
      [personName, contactNumber, Email, hashedPassword]
    );
    if (!insertResult.affectedRows) {
      return res.status(500).json({ message: "Failed to register customer" });
    }

    res.status(201).json({ message: "Customer registered successfully" });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;


