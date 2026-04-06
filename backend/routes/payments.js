const express = require("express");
const authenticate = require("../utils/auth");
const {
  createPaymentOrder,
  verifyPayment,
  getPaymentStatus,
  getPaymentHistory,
} = require("../controllers/paymentController");

const router = express.Router();

router.use(authenticate);

router.post("/create-order", createPaymentOrder);
router.post("/verify", verifyPayment);
router.get("/status/:orderId", getPaymentStatus);
router.get("/history", getPaymentHistory);

module.exports = router;
