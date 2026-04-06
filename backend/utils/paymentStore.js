const paymentStore = new Map();

const recordOrder = (orderId, data) => {
  paymentStore.set(orderId, {
    status: "created",
    createdAt: new Date().toISOString(),
    ...data,
  });
};

const getPayment = (orderId) => paymentStore.get(orderId);

const markVerified = (orderId, paymentId, signature) => {
  const existing = paymentStore.get(orderId) || {};
  const verified = {
    ...existing,
    status: "verified",
    paymentId,
    signature,
    verifiedAt: new Date().toISOString(),
  };
  paymentStore.set(orderId, verified);
  return verified;
};

const markFailed = (orderId, reason) => {
  const existing = paymentStore.get(orderId) || {};
  const failed = {
    ...existing,
    status: "failed",
    failureReason: reason,
    failedAt: new Date().toISOString(),
  };
  paymentStore.set(orderId, failed);
  return failed;
};

module.exports = {
  recordOrder,
  getPayment,
  markVerified,
  markFailed,
};
