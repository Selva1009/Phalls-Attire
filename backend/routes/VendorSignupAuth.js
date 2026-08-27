const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const { sendOTP } = require("../utils/mailer");
const { requireFields } = require("../utils/validation");

const router = express.Router();
let otpStore = {}; // Stores OTPs with expiration

// OTP Generation for Vendor
router.post("/vendor-sendotp", async (req, res) => {
  return res.status(410).json({ message: "Vendor signup is no longer available." });

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const otp = Math.floor(1000 + Math.random() * 9000); // Generate 4-digit OTP

  try {
    await sendOTP(email, otp);

    console.log(`Generated OTP for ${email}: ${otp}`);

    // Store OTP with an expiration time
    otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // Expires in 5 minutes

    res.json({ success: true, message: "OTP sent successfully!" });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// Vendor Signup
router.post("/vendor-signup", async (req, res) => {
  return res.status(410).json({ message: "Vendor signup is no longer available." });
  console.log(req.body);
  try {
    const { 
      companyName, registrationNumber, companyWebsite, gstNumber, firstName, lastName,
      phoneNumber, email, otp, address, country, state, city, postalCode, password 
    } = req.body;

    if (
      !requireFields(res, {
        companyName,
        registrationNumber,
        companyWebsite,
        gstNumber,
        firstName,
        lastName,
        phoneNumber,
        email,
        address,
        country,
        state,
        city,
        postalCode,
        password,
      })
    ) {
      return;
    }

    const [rows] = await db.query("SELECT * FROM vendorsignup WHERE email = ?", [email]);
    if (rows.length > 0) return res.status(400).json({ message: "Email already exists" });

    if (!otp) {
      return res.status(400).json({ message: "OTP is required." });
    }

    // Validate OTP
    if (!otpStore[email]) {
      return res.status(400).json({ message: "OTP expired or not found" });
    }

    console.log(`Stored OTP for ${email}: ${otpStore[email].otp}`);
    console.log(`Entered OTP: ${otp}`);

    if (Number(otpStore[email].otp) !== Number(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Delete OTP after successful verification
    delete otpStore[email];

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO vendorsignup (companyName, registrationNumber, companyWebsite, gstNumber, firstName, lastName, 
        phoneNumber, email, address, country, state, city, postalCode, password) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [companyName, registrationNumber, companyWebsite, gstNumber, firstName, lastName, phoneNumber,
       email, address, country, state, city, postalCode, hashedPassword]
    );
    if (!result.affectedRows) {
      return res.status(500).json({ message: "Failed to register vendor" });
    }

    console.log("Inserted data:", result);
    res.status(201).json({ message: "Vendor registered successfully" });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;


