"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import { API_BASE_URL } from "@/lib/api";

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    if (existing) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function CustomerPaymentPage() {
  const searchParams = useSearchParams();
  const [amount, setAmount] = useState("1300");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const paramAmount = searchParams.get("amount");
    const numericAmount = Number(paramAmount);
    if (Number.isFinite(numericAmount) && numericAmount > 0) {
      setAmount(String(numericAmount));
    }
  }, [searchParams]);

  const handlePayment = async () => {
    setError("");
    setStatus("");

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter a valid amount to continue.");
      return;
    }

    setLoading(true);

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setLoading(false);
      setError("Unable to load Razorpay checkout. Please try again.");
      return;
    }

    try {
      const orderResponse = await fetch(`${API_BASE_URL}/api/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numericAmount }),
      });

      const orderData = await orderResponse.json();
      if (!orderResponse.ok) {
        setLoading(false);
        setError(orderData.message || "Failed to create payment order.");
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Phalls",
        description: "Marketplace payment",
        order_id: orderData.orderId,
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
          emi: true,
          paylater: true,
        },
        handler: async (response) => {
          try {
            const verifyResponse = await fetch(`${API_BASE_URL}/api/payments/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
              setError(verifyData.message || "Payment verification failed.");
              setStatus("");
            } else {
              setStatus("Payment verified successfully.");
            }
          } catch (verifyError) {
            setError("Verification request failed. Please contact support.");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
        theme: {
          color: "#e91e63",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", (response) => {
        setLoading(false);
        setError(response?.error?.description || "Payment failed. Please try again.");
      });

      razorpay.open();
    } catch (createError) {
      setLoading(false);
      setError("Unable to start payment. Please try again.");
    }
  };

  return (
    <div className="payment-page">
      <Navbar disableFilters disableSearch />
      <div className="payment-shell">
        <section className="payment-card">
          <div className="payment-header">
            <span className="payment-eyebrow">Secure Checkout</span>
            <h1>Complete your payment</h1>
            <p>Test mode integration using Razorpay checkout.</p>
          </div>

          <div className="payment-form">
            <label htmlFor="payment-amount">Amount (INR)</label>
            <div className="payment-input-wrap">
              <span className="payment-currency">Rs.</span>
              <input
                id="payment-amount"
                type="number"
                inputMode="decimal"
                min="1"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="payment-input"
                placeholder="Enter amount"
              />
            </div>
            <button
              type="button"
              className="payment-button"
              onClick={handlePayment}
              disabled={loading}
            >
              {loading ? "Processing..." : "Pay Now"}
            </button>
          </div>

          {status && <div className="payment-status payment-status-success">{status}</div>}
          {error && <div className="payment-status payment-status-error">{error}</div>}
        </section>
      </div>
    </div>
  );
}
