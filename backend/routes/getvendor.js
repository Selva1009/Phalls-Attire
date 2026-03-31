const express = require("express");
const db = require("../db");

const router = express.Router();

/**
 * POST /auth/vendor/get-vendor
 * Fetch vendor details using ID (from request body)
 */
router.post("/get-vendor", async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Vendor ID is required" });
  }

  try {
    const [rows] = await db.query("SELECT * FROM vendorsignup WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    return res.status(200).json({ success: true, vendor: rows[0] });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /auth/vendor/update-vendor
 * Update vendor profile using ID (from request body)
 */
router.post("/update-vendor", async (req, res) => {
  const {
    id, companyName, registrationNumber, companyWebsite, gstNumber,
    firstName, lastName, phoneNumber, email, address,
    country, state, city, postalCode, password
  } = req.body;

  // Basic validation
  if (
    !id || !companyName || !registrationNumber || !companyWebsite || !gstNumber ||
    !firstName || !lastName || !phoneNumber || !email || !address ||
    !country || !state || !city || !postalCode || !password
  ) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const updateQuery = `
      UPDATE vendorsignup
      SET companyName = ?, registrationNumber = ?, companyWebsite = ?, gstNumber = ?,
          firstName = ?, lastName = ?, phoneNumber = ?, email = ?, address = ?,
          country = ?, state = ?, city = ?, postalCode = ?, password = ?
      WHERE id = ?
    `;

    const values = [
      companyName, registrationNumber, companyWebsite, gstNumber,
      firstName, lastName, phoneNumber, email, address,
      country, state, city, postalCode, password, id
    ];

    const [result] = await db.query(updateQuery, values);

    if (result.affectedRows > 0) {
      const [rows] = await db.query("SELECT * FROM vendorsignup WHERE id = ?", [id]);
      return res.status(200).json({
        success: true,
        message: "Vendor profile updated successfully",
        vendor: rows[0],
      });
    } else {
      return res.status(400).json({ message: "Failed to update vendor profile" });
    }
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;


