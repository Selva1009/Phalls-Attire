const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { sendSmsOtp } = require("../utils/sms");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";
const phoneOtpStore = {};

const normalizePhone = (value) => String(value || "").replace(/\D/g, "");
const isValidPhone = (value) => /^\d{10}$/.test(value);

const findUserByPhone = async (phoneNumber) => {
  const [vendorUserRows] = await db.query(
    "SELECT * FROM vendorusersignup WHERE phoneNumber = ?",
    [phoneNumber]
  );

  if (vendorUserRows.length > 0) {
    return { user: vendorUserRows[0], userType: "vendor-user" };
  }

  const [customerUserRows] = await db.query(
    "SELECT * FROM customerusersignup WHERE contactNumber = ?",
    [phoneNumber]
  );

  if (customerUserRows.length > 0) {
    return { user: customerUserRows[0], userType: "customer-user" };
  }

  return null;
};

const isActiveAccount = (user) => !user.status || user.status === "Active";

const handleSignin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Check in Vendor User table
    const [vendorUserRows] = await db.query(
      "SELECT * FROM vendorusersignup WHERE Email = ?",
      [email]
    );

    if (vendorUserRows.length > 0) {
      const vendorUser = vendorUserRows[0];

      if (vendorUser.status !== "Active") {
        return res.status(403).json({ message: "Account is inactive" });
      }

      const isMatch = await bcrypt.compare(password, vendorUser.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      const token = jwt.sign(
        { id: vendorUser.id, userType: "vendor-user" },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      return res.status(200).json({
        message: "Login successful",
        userType: "vendor-user",
        user: vendorUser,
        token,
      });
    }

    // 2. Check in Customer User table
    const [customerUserRows] = await db.query(
      "SELECT * FROM customerusersignup WHERE Email = ?",
      [email]
    );

    if (customerUserRows.length > 0) {
      const customerUser = customerUserRows[0];

      if (customerUser.status !== "Active") {
        return res.status(403).json({ message: "Account is inactive" });
      }

      const isMatch = await bcrypt.compare(password, customerUser.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      const token = jwt.sign(
        { id: customerUser.id, userType: "customer-user" },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      return res.status(200).json({
        message: "Login successful",
        userType: "customer-user",
        user: customerUser,
        token,
      });
    }

    return res.status(400).json({ message: "Invalid email or password" });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Server error" });
  }
};

router.post("/phone-sendotp", async (req, res) => {
  const phoneNumber = normalizePhone(req.body.phoneNumber);

  if (!phoneNumber) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  if (!isValidPhone(phoneNumber)) {
    return res.status(400).json({ message: "Enter a valid 10-digit mobile number" });
  }

  try {
    const record = await findUserByPhone(phoneNumber);

    if (!record) {
      return res.status(400).json({ message: "Phone number not registered" });
    }

    if (!isActiveAccount(record.user)) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    const otp = Math.floor(1000 + Math.random() * 9000);
    phoneOtpStore[phoneNumber] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

    const canSendSms = Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_SENDER_ID);
    if (!canSendSms) {
      return res.status(500).json({
        message:
          "SMS service not configured. Set MSG91_AUTH_KEY and MSG91_SENDER_ID in backend .env.",
      });
    }

    await sendSmsOtp({ phoneNumber, otp });
    console.log(`Generated login OTP for ${phoneNumber}: ${otp} (SMS sent)`);
    return res.json({ success: true, message: "OTP sent to mobile number!" });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno, message: error.message });
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/login-phone", async (req, res) => {
  const phoneNumber = normalizePhone(req.body.phoneNumber);
  const otp = String(req.body.otp || "").trim();

  if (!phoneNumber || !otp) {
    return res.status(400).json({ message: "Phone number and OTP are required" });
  }

  if (!isValidPhone(phoneNumber)) {
    return res.status(400).json({ message: "Enter a valid 10-digit mobile number" });
  }

  const storedOtp = phoneOtpStore[phoneNumber];
  if (!storedOtp) {
    return res.status(400).json({ message: "OTP expired or not found" });
  }

  if (Date.now() > storedOtp.expiresAt) {
    delete phoneOtpStore[phoneNumber];
    return res.status(400).json({ message: "OTP expired or not found" });
  }

  if (Number(storedOtp.otp) !== Number(otp)) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  try {
    const record = await findUserByPhone(phoneNumber);

    if (!record) {
      return res.status(400).json({ message: "Phone number not registered" });
    }

    if (!isActiveAccount(record.user)) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    delete phoneOtpStore[phoneNumber];

    const token = jwt.sign(
      { id: record.user.id, userType: record.userType },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(200).json({
      message: "Login successful",
      userType: record.userType,
      user: record.user,
      token,
    });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/signin", handleSignin);
router.post("/login", handleSignin);

module.exports = router;


