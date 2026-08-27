const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { sendOTP } = require("../utils/mailer");

const router = express.Router();
let otpStore = {};

// Send OTP
router.post("/vendor-sendotp", async (req, res) => {
  return res.status(410).json({ message: "Vendor signup is no longer available." });
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

// Vendor Signup — directly into vendorusersignup
router.post("/vendor-signup", async (req, res) => {
  return res.status(410).json({ message: "Vendor signup is no longer available." });
  try {
    const { companyName, personName, phoneNumber, Email, otp, password } = req.body;

    if (!companyName || !personName || !phoneNumber || !Email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [existing] = await db.query(
      "SELECT * FROM vendorusersignup WHERE Email = ?",
      [Email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    if (!otp) return res.status(400).json({ message: "OTP is required" });

    if (!otpStore[Email]) {
      return res.status(400).json({ message: "OTP expired or not found" });
    }

    if (Number(otpStore[Email].otp) !== Number(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    delete otpStore[Email];

    const hashedPassword = await bcrypt.hash(password, 10);

    const [insertResult] = await db.query(
      `INSERT INTO vendorusersignup (companyName, personName, phoneNumber, Email, password)
       VALUES (?, ?, ?, ?, ?)`,
      [companyName, personName, phoneNumber, Email, hashedPassword]
    );
    if (!insertResult.affectedRows) {
      return res.status(500).json({ message: "Failed to register vendor" });
    }

    res.status(201).json({ message: "Vendor registered successfully" });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

