const Razorpay = require("razorpay");
const crypto = require("crypto");

let razorpayClient;

const getRazorpayClient = () => {
  if (razorpayClient) return razorpayClient;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys are not configured.");
  }

  razorpayClient = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  return razorpayClient;
};

const createOrder = async ({ amountInPaise, currency, receipt, notes }) => {
  const client = getRazorpayClient();
  return client.orders.create({
    amount: amountInPaise,
    currency,
    receipt,
    notes,
  });
};

const verifySignature = ({ orderId, paymentId, signature }) => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const payload = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(payload)
    .digest("hex");

  return expectedSignature === signature;
};

// Placeholder hooks for future feature expansion
const createRefund = async () => {
  throw new Error("Refunds are not implemented yet.");
};

const createSubscription = async () => {
  throw new Error("Subscriptions are not implemented yet.");
};

module.exports = {
  createOrder,
  verifySignature,
  createRefund,
  createSubscription,
};
