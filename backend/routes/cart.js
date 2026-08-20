const express = require("express");
const db = require("../db");
const authenticate = require("../utils/auth");
const { requireFields } = require("../utils/validation");
const router = express.Router();

router.use(authenticate);

// Fetch cart items
router.get("/:customerId", async (req, res) => {
  const customerId = Number(req.params.customerId);

  if (customerId !== Number(req.user.id)) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const query = `
      SELECT cart.id, cart.product_id, cart.quantity, products.productName, products.price, products.productImage, products.vendor_id
      FROM cart
      JOIN products ON cart.product_id = products.id
      WHERE cart.customer_id = ?
    `;
    const [cartItems] = await db.query(query, [customerId]);
    res.status(200).json({ cartItems });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ error: "Failed to fetch cart items" });
  }
});

// Add item to cart 
router.post("/add", async (req, res) => {
  const { customerId, productId, quantity } = req.body;
  const resolvedCustomerId = Number(req.user.id);

  if (!requireFields(res, { productId, quantity })) {
    return;
  }

  if (customerId && Number(customerId) !== resolvedCustomerId) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  try {
    // Check if product exists in cart
    const [existingItem] = await db.query(
      "SELECT * FROM cart WHERE customer_id = ? AND product_id = ?",
      [resolvedCustomerId, productId]
    );

    if (existingItem.length > 0) {
      const newQuantity = existingItem[0].quantity + quantity;
      const [updateResult] = await db.query(
        "UPDATE cart SET quantity = ? WHERE id = ?",
        [newQuantity, existingItem[0].id]
      );
      if (!updateResult.affectedRows) {
        return res.status(500).json({ success: false, message: "Failed to update cart" });
      }
      return res.status(200).json({ success: true, message: "Cart updated successfully" });
    }

    // Insert new item
    const [insertResult] = await db.query(
      "INSERT INTO cart (customer_id, product_id, quantity) VALUES (?, ?, ?)",
      [resolvedCustomerId, productId, quantity]
    );
    if (!insertResult.affectedRows) {
      return res.status(500).json({ success: false, message: "Failed to add item" });
    }

    res.status(201).json({ success: true, message: "Item added to cart" });

  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// Update cart item quantity
router.put("/update", async (req, res) => {
  const { cartId, action } = req.body;

  if (!requireFields(res, { cartId, action })) {
    return;
  }

  try {
    const [cartItem] = await db.query(
      "SELECT * FROM cart WHERE id = ? AND customer_id = ?",
      [cartId, req.user.id]
    );

    if (!cartItem.length)
      return res.status(404).json({ message: "Item not found" });

    let updatedQuantity = cartItem[0].quantity;
    if (action === "increment") updatedQuantity += 1;
    if (action === "decrement" && updatedQuantity > 1) updatedQuantity -= 1;

    const [updateResult] = await db.query(
      "UPDATE cart SET quantity = ? WHERE id = ? AND customer_id = ?",
      [updatedQuantity, cartId, req.user.id]
    );
    if (!updateResult.affectedRows) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.status(200).json({ success: true, message: "Cart item updated." });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Server error" });
  }
});

// Delete cart item
router.delete("/delete/:cartId", async (req, res) => {
  const { cartId } = req.params;

  if (!requireFields(res, { cartId })) {
    return;
  }

  try {
    const [cartItem] = await db.query(
      "SELECT * FROM cart WHERE id = ? AND customer_id = ?",
      [cartId, req.user.id]
    );

    if (!cartItem.length)
      return res.status(404).json({ message: "Item not found" });

    const [deleteResult] = await db.query(
      "DELETE FROM cart WHERE id = ? AND customer_id = ?",
      [cartId, req.user.id]
    );
    if (!deleteResult.affectedRows) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.status(200).json({ success: true, message: "Item removed." });
  } catch (error) {
    console.error("Server error", { code: error.code, errno: error.errno });
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;


