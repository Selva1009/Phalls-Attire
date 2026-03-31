"use client";

import { API_BASE_URL } from "@/lib/api";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Sparkle,
  Minus,
  Plus,
  Bell,
  Loader2,
  FileCog,
  Trash2,
  Package,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import Navbar from "../components/Navbar";
import Footer from "@/app/LandingPage/Footer";

const formatPrice = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const CartPage = () => {
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState({});
  const [checkingOut, setCheckingOut] = useState(false);
  const router = useRouter();

  const fetchCartItems = useCallback(async (currentCustomerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/${currentCustomerId}`, {
        headers: getAuthHeader(),
      });
      if (response.status === 401) {
        router.push("/SignIn");
        return;
      }
      const data = await response.json();
      if (response.ok) setCart(data.cartItems || []);
      else toast.error("Failed to load cart items");
    } catch (error) {
      toast.error("Error fetching cart items");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedCustomer = localStorage.getItem("customerUser");
    if (storedCustomer) {
      const customerData = JSON.parse(storedCustomer);
      setCustomerId(customerData.id);
      fetchCartItems(customerData.id);
    } else {
      setLoading(false);
    }
  }, [fetchCartItems]);

  const updateQuantity = async (cartId, action) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ cartId, action }),
      });
      if (response.status === 401) {
        router.push("/SignIn");
        return;
      }

      if (response.ok) {
        setCart((prev) =>
          prev.map((item) =>
            item.id === cartId
              ? {
                  ...item,
                  quantity:
                    action === "increment"
                      ? item.quantity + 1
                      : Math.max(1, item.quantity - 1),
                }
              : item
          )
        );
      } else {
        toast.error("Failed to update quantity");
      }
    } catch (error) {
      toast.error("Server error while updating quantity");
    }
  };

  const removeFromCart = async (cartId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/delete/${cartId}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });
      if (response.status === 401) {
        router.push("/SignIn");
        return;
      }
      if (response.ok) {
        setCart(cart.filter((item) => item.id !== cartId));
        toast.success("Item removed from cart");
      } else {
        toast.error("Failed to remove item");
      }
    } catch (error) {
      toast.error("Server error while removing item");
    }
  };

  const notifyVendor = async (item) => {
    const storedCustomer = localStorage.getItem("customerUser");
    if (!storedCustomer) return toast.error("Please log in");

    const { Email } = JSON.parse(storedCustomer);
    setNotifying((prev) => ({ ...prev, [item.id]: true }));

    try {
      const res = await fetch(`${API_BASE_URL}/api/notification/notify-vendor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Email,
          cart: [
            {
              productId: item.product_id,
              productName: item.productName,
              quantity: item.quantity,
            },
          ],
        }),
      });

      res.ok
        ? toast.success(`Notification sent for ${item.productName}`)
        : toast.error("Failed to notify vendor");
    } catch (error) {
      toast.error("Server error while sending notification");
    } finally {
      setNotifying((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const initiatePO = async (item) => {
    const storedCustomer = localStorage.getItem("customerUser");
    if (!storedCustomer) return toast.error("Please log in");

    const { id } = JSON.parse(storedCustomer);
    setNotifying((prev) => ({ ...prev, [item.id]: true }));

    try {
      const res = await fetch(`${API_BASE_URL}/api/po/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: id,
          productId: item.product_id,
          quantity: item.quantity,
        }),
      });

      res.ok
        ? toast.success(`PO generated for ${item.productName}`)
        : toast.error("Failed to generate PO");
    } catch (error) {
      toast.error("Server error while generating PO");
    } finally {
      setNotifying((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const handleCheckout = async () => {
    if (!cart.length) {
      toast.info("Your cart is empty");
      return;
    }

    const storedCustomer = localStorage.getItem("customerUser");
    if (!storedCustomer) {
      toast.error("Please log in");
      return;
    }

    const { id } = JSON.parse(storedCustomer);
    setCheckingOut(true);

    try {
      const results = await Promise.all(
        cart.map(async (item) => {
          const response = await fetch(`${API_BASE_URL}/api/po/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerId: id,
              productId: item.product_id,
              quantity: item.quantity,
            }),
          });

          return {
            item,
            ok: response.ok,
          };
        })
      );

      const failedItems = results.filter((result) => !result.ok);

      if (failedItems.length === results.length) {
        toast.error("Checkout failed");
        return;
      }

      const successfulItemIds = results
        .filter((result) => result.ok)
        .map((result) => result.item.id);

      if (successfulItemIds.length > 0) {
        setCart((currentCart) =>
          currentCart.filter((item) => !successfulItemIds.includes(item.id))
        );
      }

      if (failedItems.length > 0) {
        toast.warning("Some items could not be checked out");
        return;
      }

      toast.success("Checkout completed successfully");
      window.location.href = "/customer/PoAutomation";
    } catch (error) {
      toast.error("Server error during checkout");
    } finally {
      setCheckingOut(false);
    }
  };

  const totalPrice = cart.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );

  if (loading) {
    return (
      <div className="cart-loading-shell">
        <Loader2 className="cart-loading-spinner" />
      </div>
    );
  }

  if (!customerId) {
    return (
      <div className="cart-empty-state-page">
        <div className="cart-empty-card">
          <h2>Your Cart Awaits</h2>
          <p>Sign in to view your saved items and continue shopping.</p>
          <button
            type="button"
            className="cart-primary-button"
            onClick={() => {
              window.location.href = "/login";
            }}
          >
            Login to Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar disableFilters disableSearch />
      <div className="cart-page">
        <ToastContainer position="bottom-right" autoClose={3000} />

        <section className="cart-hero">
          <div className="cart-hero-badge">
            <ShoppingCart size={24} />
          </div>
          <div className="cart-hero-copy">
            <p className="cart-section-label">Your Cart</p>
            <h1>Soft picks, ready for checkout.</h1>
            <p>
              {cart.length > 0
                ? `You have ${cart.length} curated ${cart.length === 1 ? "item" : "items"} in your bag.`
                : "Your favourite finds will appear here as you add them."}
            </p>
          </div>
        </section>

        <div className="cart-content">
          <section className="cart-items-panel">
            {cart.length === 0 ? (
              <div className="cart-empty-card cart-inline-empty">
                <div className="cart-empty-icon">
                  <Sparkle size={28} />
                </div>
                <h3>Your cart feels light</h3>
                <p>Explore premium styles and start building your collection.</p>
                <a href="/customer/products" className="cart-primary-button cart-link-button">
                  Explore Marketplace
                </a>
              </div>
            ) : (
              cart.map((item) => (
                <article key={item.id} className="cart-item-card">
                  <div className="cart-item-media">
                    <img
                      src={`${API_BASE_URL}/uploads/${item.productImage}`}
                      alt={item.productName}
                      className="cart-item-image"
                    />
                  </div>

                  <div className="cart-item-main">
                    <div className="cart-item-header">
                      <div>
                        <h3>{item.productName}</h3>
                        <p className="cart-item-price">{formatPrice(item.price)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="cart-remove-button"
                      >
                        <Trash2 size={16} />
                        <span>Remove</span>
                      </button>
                    </div>

                    <div className="cart-item-controls">
                      <div className="cart-quantity-box">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, "decrement")}
                          disabled={item.quantity === 1}
                          className="cart-quantity-button"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="cart-quantity-value">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, "increment")}
                          className="cart-quantity-button"
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <div className="cart-item-actions">
                        <button
                          type="button"
                          onClick={() => notifyVendor(item)}
                          disabled={notifying[item.id]}
                          className="cart-soft-button"
                        >
                          {notifying[item.id] ? (
                            <Loader2 className="cart-inline-spinner" />
                          ) : (
                            <Bell size={16} />
                          )}
                          <span>Notify</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => initiatePO(item)}
                          disabled={notifying[item.id]}
                          className="cart-soft-button"
                        >
                          {notifying[item.id] ? (
                            <Loader2 className="cart-inline-spinner" />
                          ) : (
                            <FileCog size={16} />
                          )}
                          <span>Create PO</span>
                        </button>
                      </div>
                    </div>

                    <div className="cart-item-total">
                      <div className="cart-item-total-label">
                        <Package size={16} />
                        <span>Item Total</span>
                      </div>
                      <strong>{formatPrice(item.price * item.quantity)}</strong>
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>

          <aside className="cart-summary-panel">
            <p className="cart-section-label">Summary</p>
            <h2>Total price</h2>

            <div className="cart-summary-row">
              <span>Products</span>
              <span>{cart.length}</span>
            </div>
            <div className="cart-summary-row">
              <span>Estimated total</span>
              <strong>{formatPrice(totalPrice)}</strong>
            </div>

            <button
              type="button"
              className="cart-primary-button cart-checkout-button"
              onClick={handleCheckout}
              disabled={checkingOut || cart.length === 0}
            >
              {checkingOut ? <Loader2 className="cart-inline-spinner" /> : null}
              {checkingOut ? "Processing..." : "Checkout"}
            </button>

           
          </aside>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CartPage;
