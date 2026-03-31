const express = require("express");
const pool = require("../db");
const nodemailer = require("nodemailer");
const router = express.Router();
require("dotenv").config();
const {sendConfirmationEmail}=require("../utils/mailer");

// API route to handle contact form submission
router.post("/contactus", async (req, res) => {
  const { name, email, comment } = req.body;

  // Validation
  if (!name || !email || !comment) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // Store the contact form data in the database
    const [rows] = await pool.query(
      "INSERT INTO contact_us (name, email, comment) VALUES (?, ?, ?)",
      [name, email, comment]
    );
    if (!rows.affectedRows) {
      return res.status(500).json({ message: "Failed to submit contact form." });
    }

    // Send confirmation email to the user
    await sendConfirmationEmail(name,email);

    // Respond back with success
    res.status(200).json({ message: "Your message has been sent successfully!" });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
});

module.exports = router;


