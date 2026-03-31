const express = require("express");
const db = require("../db");

const router = express.Router();

// Update customer profile
router.post("/update-profile", async (req, res) => {
  const {
    id, companyName, registrationNumber, gstNumber,
    firstName, lastName, phoneNumber, email, address, 
    country, state, city, postalCode
  } = req.body;

  try {
    // Ensure all required fields are provided
    if (!id || !firstName || !lastName || !email || !phoneNumber || !address || !country ||!state || !city || !postalCode
      || !companyName ||!registrationNumber || !gstNumber
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // SQL query to update the customer profile
    const updateQuery = `
      UPDATE customersignup 
      SET companyName = ?, registrationNumber = ?, gstNumber = ?, firstName = ?, lastName = ?, 
          phoneNumber = ?, email = ?, address = ?, country = ?, state = ?, city = ?, postalCode = ?
      WHERE id = ?
    `;

    // Execute query
    const [result] = await db.query(updateQuery, [
      companyName, registrationNumber, gstNumber, firstName, lastName, 
      phoneNumber, email, address, country, state, city, postalCode, id
    ]);

    if (result.affectedRows > 0) {
      // Fetch the updated customer details
      const [rows] = await db.query("SELECT * FROM customersignup WHERE id = ?", [id]);
      const updatedCustomer = rows.length > 0 ? rows[0] : null;

      return res.status(200).json({
        message: "Profile updated successfully",
        customer: updatedCustomer,
      });
    } else {
      return res.status(400).json({ message: "Failed to update profile" });
    }
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

