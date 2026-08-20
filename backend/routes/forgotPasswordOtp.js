const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");
const { sendOTP } = require("../utils/mailer");

const router = express.Router();
let otpStore = {};

// Forgot Password - Send OTP
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check vendorusersignup
    const [vendorUser] = await db.query(
      "SELECT * FROM vendorusersignup WHERE Email = ?",
      [email]
    );

    // Check customerusersignup
    const [customerUser] = await db.query(
      "SELECT * FROM customerusersignup WHERE Email = ?",
      [email]
    );

    if (vendorUser.length === 0 && customerUser.length === 0) {
      return res.json({
        success: true,
        message: "If the email is registered, an OTP will be sent.",
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000);

    try {
      await sendOTP(email, otp);
      otpStore[email] = otp;
      console.log(`Generated OTP for ${email}: ${otp}`);
      return res.json({ success: true, message: "OTP sent successfully!" });
    } catch (error) {
      console.error("Server error", { code: error.code, errno: error.errno });
      return res.status(500).json({ error: "Failed to send OTP" });
    }
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    return res.status(500).json({ error: "Failed to process request" });
  }
});

// Forgot Password - OTP Verification
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    if (!otpStore[email]) {
      return res.status(400).json({ error: "OTP expired or not generated for this email" });
    }

    if (Number(otpStore[email]) !== Number(otp)) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    delete otpStore[email];
    return res.json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    return res.status(500).json({ error: "Failed to process request" });
  }
});

// Forgot Password - Reset Password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({
        error: "Email, New Password, and Confirm Password are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Check vendorusersignup
    const [vendorUser] = await db.query(
      "SELECT * FROM vendorusersignup WHERE Email = ?",
      [email]
    );

    if (vendorUser.length > 0) {
      const [updateResult] = await db.query(
        "UPDATE vendorusersignup SET password = ? WHERE Email = ?",
        [hashedPassword, email]
      );
      if (!updateResult.affectedRows) {
        return res.status(500).json({ error: "Failed to reset password" });
      }
      return res.json({ success: true, message: "Password reset successfully" });
    }

    // Check customerusersignup
    const [customerUser] = await db.query(
      "SELECT * FROM customerusersignup WHERE Email = ?",
      [email]
    );

    if (customerUser.length > 0) {
      const [updateResult] = await db.query(
        "UPDATE customerusersignup SET password = ? WHERE Email = ?",
        [hashedPassword, email]
      );
      if (!updateResult.affectedRows) {
        return res.status(500).json({ error: "Failed to reset password" });
      }
      return res.json({ success: true, message: "Password reset successfully" });
    }

    return res.status(404).json({ error: "Email not found" });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    return res.status(500).json({ error: "Failed to process request" });
  }
});

module.exports = router;

