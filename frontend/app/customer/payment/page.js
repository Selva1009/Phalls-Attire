"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  const router = useRouter();
  const [amount, setAmount] = useState("1300");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingOrder, setPendingOrder] = useState(null);
  const [amountLocked, setAmountLocked] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const itemsCount = pendingOrder?.items?.length || 0;
  const addressLineTwo = selectedAddress
    ? [selectedAddress.city, selectedAddress.state, selectedAddress.pincode || selectedAddress.postalCode]
        .filter(Boolean)
        .join(" ")
    : "";

  const resolveSelectedAddress = (pending) => {
    if (pending?.shipToAddress) return pending.shipToAddress;
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("activeAddress");
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const paramAmount = searchParams.get("amount");
    const numericAmount = Number(paramAmount);
    if (Number.isFinite(numericAmount) && numericAmount > 0) {
      setAmount(String(numericAmount));
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const pending = localStorage.getItem("pendingPayment");
    if (!pending) return;
    try {
      const parsed = JSON.parse(pending);
      if (parsed?.totalAmount) {
        setPendingOrder(parsed);
        setAmount(String(parsed.totalAmount));
        setAmountLocked(true);
      }
      setSelectedAddress(resolveSelectedAddress(parsed));
    } catch {
      setPendingOrder(null);
      setAmountLocked(false);
      setSelectedAddress(resolveSelectedAddress(null));
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStorage = () => {
      setSelectedAddress(resolveSelectedAddress(pendingOrder));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [pendingOrder]);

  const cleanupLocalCart = () => {
    if (!pendingOrder?.items?.length) {
      return;
    }
    try {
      const cartKey = `cart_${pendingOrder.customerId}`;
      const localCart = JSON.parse(localStorage.getItem(cartKey) || "[]");
      const updatedCart = localCart.filter(
        (localItem) => !pendingOrder.items.some((item) => item.cartId === localItem.id)
      );
      localStorage.setItem(cartKey, JSON.stringify(updatedCart));
    } catch {
      // ignore local cart cleanup errors
    }
  };

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
      const token = localStorage.getItem("token");
    const payload = pendingOrder
      ? {
          customerId: pendingOrder.customerId,
          items: pendingOrder.items,
          shipToAddress: pendingOrder.shipToAddress || selectedAddress,
        }
      : { amount: numericAmount };

      const orderResponse = await fetch(`${API_BASE_URL}/api/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
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
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok) {
              setError(verifyData.message || "Payment verification failed.");
              setStatus("");
            } else {
              cleanupLocalCart();
              localStorage.removeItem("pendingPayment");
              setStatus("Payment verified successfully.");
              setTimeout(() => {
                router.push("/customer/PoAutomation");
              }, 800);
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
        <div className="payment-layout">
          <section className="payment-card">
            <div className="payment-header">
              <span className="payment-eyebrow">Secure Checkout</span>
              <h1>Complete your payment</h1>
              <p>Fast, encrypted checkout powered by Razorpay.</p>
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
                  disabled={amountLocked}
                />
              </div>
              {amountLocked && (
                <p className="payment-lock-note">Amount locked to current order.</p>
              )}
              <button
                type="button"
                className="payment-button"
                onClick={handlePayment}
                disabled={loading}
              >
                {loading ? "Processing..." : "Pay Now"}
              </button>
              {/* <div className="payment-methods">
                <span>UPI</span>
                <span>Card</span>
                <span>Netbanking</span>
                <span>Wallet</span>
                <span>Pay Later</span>
              </div> */}
            </div>

            {status && <div className="payment-status payment-status-success">{status}</div>}
            {error && <div className="payment-status payment-status-error">{error}</div>}
          </section>

          <aside className="payment-summary">
            <div className="summary-header">
              <span>Order summary</span>
              <strong>₹{Number(amount || 0).toLocaleString("en-IN")}</strong>
            </div>
            <div className="summary-row">
              <span>Items</span>
              <span>{itemsCount || "-"}</span>
            </div>
            <div className="summary-address">
              <p>Deliver to</p>
              <span>{selectedAddress?.address_line || selectedAddress?.address || "Address on file"}</span>
              {addressLineTwo && <span>{addressLineTwo}</span>}
            </div>
            <div className="summary-divider" />
            <div className="summary-trust">
              <div>
                <strong>Secure payments</strong>
                <span>256-bit SSL encryption</span>
              </div>
              <div>
                <strong>Instant confirmation</strong>
                <span>Email</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
