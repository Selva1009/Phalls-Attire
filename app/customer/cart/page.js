"use client";

import { API_BASE_URL, getProductImageSource } from "@/lib/api";
import { useState, useEffect, useCallback, useMemo } from "react";
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

const formatPrice = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const normalizeAddressForPayload = (address) => {
  if (!address) return null;
  if (typeof address === "string") {
    const trimmed = address.trim();
    return trimmed ? { address: trimmed } : null;
  }
  const resolvedAddress =
    address.address || address.address_line || address.addressLine || "";
  const resolvedPostal =
    address.postalCode ||
    address.postal_code ||
    address.pincode ||
    address.zip ||
    address.zipCode ||
    "";

  return {
    address: resolvedAddress,
    city: address.city || "",
    state: address.state || "",
    country: address.country || "India",
    postalCode: resolvedPostal,
  };
};

const CartPage = () => {
  const [cart, setCart] = useState([]);
  const [customerId, setCustomerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifying, setNotifying] = useState({});
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [checkoutSizes, setCheckoutSizes] = useState({});
  const [checkoutQuantities, setCheckoutQuantities] = useState({});
  const [addressOpen, setAddressOpen] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [activeAddress, setActiveAddress] = useState(null);
  const [showAllSidebarAddresses, setShowAllSidebarAddresses] = useState(false);
  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    address_line: "",
    city: "",
    state: "",
    pincode: "",
  });
  const router = useRouter();
  const imageCacheBuster = useMemo(() => Date.now(), []);
  const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"];

  const fetchCartItems = useCallback(async (currentCustomerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/${currentCustomerId}`, {
        headers: getAuthHeader(),
      });
      if (response.status === 401) {
        router.push("/Home");
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("activeAddress");
    if (stored) {
      try {
        setActiveAddress(JSON.parse(stored));
      } catch {
        setActiveAddress(null);
      }
    }
    const handleStorage = () => {
      const next = localStorage.getItem("activeAddress");
      setActiveAddress(next ? JSON.parse(next) : null);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const updateQuantity = async (cartId, action) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify({ cartId, action }),
      });
      if (response.status === 401) {
        router.push("/Home");
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
        router.push("/Home");
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

  const fetchAddresses = async () => {
    setAddressLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/address`, {
        headers: getAuthHeader(),
      });
      if (response.status === 401) {
        router.push("/Home");
        return;
      }
      const data = await response.json();
      setAddresses(Array.isArray(data.addresses) ? data.addresses : []);
    } catch (error) {
      toast.error("Failed to load addresses");
    } finally {
      setAddressLoading(false);
    }
  };

  const handleSelectAddress = (address) => {
    setActiveAddress(address);
    if (typeof window !== "undefined") {
      localStorage.setItem("activeAddressId", String(address.id));
      localStorage.setItem("activeAddress", JSON.stringify(address));
      window.dispatchEvent(new Event("storage"));
    }
  };

  const handleAddressOpen = () => {
    setAddressOpen(true);
    fetchAddresses();
  };

  const handleAddressSubmit = async (event) => {
    event.preventDefault();
    const payload = {
      name: addressForm.name.trim(),
      phone: addressForm.phone.trim(),
      address_line: addressForm.address_line.trim(),
      city: addressForm.city.trim(),
      state: addressForm.state.trim(),
      pincode: addressForm.pincode.trim(),
    };

    if (
      !payload.name ||
      !payload.phone ||
      !payload.address_line ||
      !payload.city ||
      !payload.state ||
      !payload.pincode
    ) {
      toast.error("Please fill all address fields");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/address`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(payload),
      });
      if (response.status === 401) {
        router.push("/Home");
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to save address");
      }
      setAddresses((prev) => [data.address, ...prev]);
      setAddressForm({
        name: "",
        phone: "",
        address_line: "",
        city: "",
        state: "",
        pincode: "",
      });
      toast.success("Address added");
    } catch (error) {
      toast.error(error.message || "Failed to save address");
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

  const openCheckout = (items) => {
    if (!items.length) {
      toast.info("Your cart is empty");
      return;
    }

    const storedCustomer = localStorage.getItem("customerUser");
    if (!storedCustomer) {
      toast.error("Please log in");
      return;
    }

    const qtyMap = {};
    const sizeMap = {};
    items.forEach((item) => {
      qtyMap[item.id] = Number(item.quantity || 1);
      sizeMap[item.id] = sizeOptions.includes(item.size) ? item.size : "M";
    });
    setCheckoutItems(items);
    setCheckoutQuantities(qtyMap);
    setCheckoutSizes(sizeMap);
    setCheckoutOpen(true);
  };

  const updateCheckoutQty = (itemId, value) => {
    const safeValue = Math.max(1, Number(value || 1));
    setCheckoutQuantities((prev) => ({ ...prev, [itemId]: safeValue }));
  };

  const updateCheckoutSize = (itemId, value) => {
    setCheckoutSizes((prev) => ({ ...prev, [itemId]: value }));
  };

  const proceedToPayment = () => {
    const storedCustomer = localStorage.getItem("customerUser");
    if (!storedCustomer) {
      toast.error("Please log in");
      return;
    }

    const customer = JSON.parse(storedCustomer);
    const shipToAddress = normalizeAddressForPayload(
      JSON.parse(localStorage.getItem("activeAddress") || "null")
    );

    const items = checkoutItems.map((item) => ({
      cartId: item.id,
      productId: item.product_id,
      productName: item.productName,
      price: Number(item.price || 0),
      quantity: checkoutQuantities[item.id] || 1,
      size: checkoutSizes[item.id] || "M",
      image: item.productImage,
    }));

    const totalAmount = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      toast.error("Please select a valid quantity.");
      return;
    }

    const payload = {
      customerId: customer.id,
      items,
      totalAmount,
      shipToAddress,
      createdAt: Date.now(),
    };

    localStorage.setItem("pendingPayment", JSON.stringify(payload));
    setCheckoutOpen(false);
    router.push("/customer/payment");
  };

  const totalPrice = cart.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );
  const checkoutTotal = checkoutItems.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * Number(checkoutQuantities[item.id] || 1),
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
              router.push("/login");
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
      <Navbar disableFilters disableSearch hideCategories />
      <div className="cart-page">
        <ToastContainer position="bottom-right" autoClose={3000} />

        <section className="cart-address-bar">
          <div>
            <p className="cart-address-title">
              {activeAddress
                ? `${activeAddress.name} - ${activeAddress.city} - ${activeAddress.pincode}`
                : "From Saved Addresses"}
            </p>
          </div>
          <button
            type="button"
            className="cart-pincode-button"
            onClick={handleAddressOpen}
          >
            Enter Delivery Pincode
          </button>
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
                <a href="/Home" className="cart-primary-button cart-link-button">
                  Explore Marketplace
                </a>
              </div>
            ) : (
              cart.map((item) => (
                <article key={item.id} className="cart-item-card">
                  <div className="cart-item-media">
                    <img
                      src={getProductImageSource(item, imageCacheBuster) || "/notfound.jpg"}
                      alt={item.productName}
                      className="cart-item-image"
                      onError={(event) => {
                        event.currentTarget.src = "/notfound.jpg";
                      }}
                    />
                  </div>

                  <div className="cart-item-main">
                    <div className="cart-item-header">
                      <div>
                        <h3>{item.productName}</h3>
                        <p className="cart-item-meta">
                          Seller: {item.vendor_name || "Seller"}
                        </p>
                        <p className="cart-item-meta">Delivery by Fri Apr 3</p>
                      </div>
                      <div className="cart-item-price-row">
                        <span className="cart-item-price">{formatPrice(item.price)}</span>
                      </div>
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
                        {/* actions trimmed */}
                      </div>
                    </div>

                    <div className="cart-item-total">
                      <div className="cart-item-total-label">
                        <Package size={16} />
                        <span>Item Total</span>
                      </div>
                      <strong>{formatPrice(item.price * item.quantity)}</strong>
                    </div>

                    <div className="cart-item-footer-actions">
                      <button
                        type="button"
                        className="cart-footer-button"
                        onClick={() => notifyVendor(item)}
                        disabled={notifying[item.id]}
                      >
                        {notifying[item.id] ? "Notifying..." : "Notify"}
                      </button>
                      <button
                        type="button"
                        className="cart-footer-button"
                        onClick={() => removeFromCart(item.id)}
                      >
                        Remove
                      </button>
                      <button
                        type="button"
                        className="cart-footer-button cart-footer-primary"
                        onClick={() => openCheckout([item])}
                        disabled={notifying[item.id]}
                      >
                        Place order
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>

          {/* Summary panel removed as requested */}
        </div>
      </div>

      {checkoutOpen && (
        <div className="cart-checkout-overlay" onClick={() => setCheckoutOpen(false)}>
          <div
            className="cart-checkout-modal cart-checkout-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="cart-checkout-header">
              <div>
                <p className="cart-checkout-eyebrow">Checkout</p>
                <h3>Select size and quantity</h3>
              </div>
              <button
                type="button"
                className="cart-checkout-close"
                onClick={() => setCheckoutOpen(false)}
              >
                X
              </button>
            </div>

            <div className="cart-checkout-items">
              {checkoutItems.map((item) => (
                <div key={item.id} className="cart-checkout-item">
                  <img
                    src={getProductImageSource(item, imageCacheBuster) || "/notfound.jpg"}
                    alt={item.productName}
                    className="cart-checkout-image"
                    onError={(event) => {
                      event.currentTarget.src = "/notfound.jpg";
                    }}
                  />
                  <div className="cart-checkout-info">
                    <p className="cart-checkout-name">{item.productName}</p>
                    <p className="cart-checkout-price">{formatPrice(item.price)}</p>

                    <div className="cart-checkout-row">
                      <span>Size</span>
                      <div className="cart-size-options">
                        {sizeOptions.map((size) => (
                          <button
                            key={size}
                            type="button"
                            className={`cart-size-chip ${
                              checkoutSizes[item.id] === size ? "active" : ""
                            }`}
                            onClick={() => updateCheckoutSize(item.id, size)}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="cart-checkout-row">
                      <span>Quantity</span>
                      <div className="cart-qty-control">
                        <button
                          type="button"
                          onClick={() =>
                            updateCheckoutQty(
                              item.id,
                              (checkoutQuantities[item.id] || 1) - 1
                            )
                          }
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={checkoutQuantities[item.id] || 1}
                          onChange={(event) =>
                            updateCheckoutQty(item.id, event.target.value)
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateCheckoutQty(
                              item.id,
                              (checkoutQuantities[item.id] || 1) + 1
                            )
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-checkout-footer">
              <div className="cart-checkout-total">
                <span>Total</span>
                <strong>{formatPrice(checkoutTotal)}</strong>
              </div>
              <button
                type="button"
                className="cart-primary-button cart-checkout-cta"
                onClick={proceedToPayment}
              >
                Continue to Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {addressOpen && (
        <div className="cart-address-overlay" onClick={() => setAddressOpen(false)}>
          <div className="cart-address-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="cart-address-drawer-head">
              <h3>Select delivery address</h3>
              <button
                type="button"
                className="cart-address-close"
                onClick={() => setAddressOpen(false)}
              >
                X
              </button>
            </div>

            <div className="cart-address-section">
              <p className="cart-address-section-title">Saved addresses</p>
              {addressLoading ? (
                <div className="cart-address-empty">Loading addresses...</div>
              ) : addresses.length > 0 ? (
                <>
                  <div className="cart-address-list">
                    {(showAllSidebarAddresses ? addresses : addresses.slice(0, 2)).map((address) => (
                      <div
                        key={address.id}
                        className={`cart-address-card ${
                          activeAddress?.id === address.id ? "cart-address-card-active" : ""
                        }`}
                        onClick={() => {
                          handleSelectAddress(address);
                          setAddressOpen(false);
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            handleSelectAddress(address);
                            setAddressOpen(false);
                          }
                        }}
                      >
                        <p className="cart-address-name">{address.name}</p>
                        <p className="cart-address-text">{address.address_line}</p>
                        <p className="cart-address-text">
                          {address.city}, {address.state} - {address.pincode}
                        </p>
                        <p className="cart-address-text">{address.phone}</p>
                      </div>
                    ))}
                  </div>
                  {addresses.length > 2 && !showAllSidebarAddresses && (
                    <button
                      type="button"
                      className="cart-address-showmore"
                      onClick={() => setShowAllSidebarAddresses(true)}
                    >
                      Show more
                    </button>
                  )}
                  {addresses.length > 2 && showAllSidebarAddresses && (
                    <button
                      type="button"
                      className="cart-address-showmore"
                      onClick={() => setShowAllSidebarAddresses(false)}
                    >
                      Show less
                    </button>
                  )}
                </>
              ) : (
                <div className="cart-address-empty">No saved addresses yet.</div>
              )}
            </div>

            <div className="cart-address-section">
              <p className="cart-address-section-title">Add address</p>
              <form className="cart-address-form" onSubmit={handleAddressSubmit}>
                <input
                  type="text"
                  placeholder="Full name"
                  value={addressForm.name}
                  onChange={(event) =>
                    setAddressForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
                <input
                  type="text"
                  placeholder="Phone number"
                  value={addressForm.phone}
                  onChange={(event) =>
                    setAddressForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                />
                <textarea
                  placeholder="Address line"
                  value={addressForm.address_line}
                  onChange={(event) =>
                    setAddressForm((prev) => ({ ...prev, address_line: event.target.value }))
                  }
                />
                <div className="cart-address-form-row">
                  <input
                    type="text"
                    placeholder="City"
                    value={addressForm.city}
                    onChange={(event) =>
                      setAddressForm((prev) => ({ ...prev, city: event.target.value }))
                    }
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={addressForm.state}
                    onChange={(event) =>
                      setAddressForm((prev) => ({ ...prev, state: event.target.value }))
                    }
                  />
                </div>
                <input
                  type="text"
                  placeholder="Pincode"
                  value={addressForm.pincode}
                  onChange={(event) =>
                    setAddressForm((prev) => ({ ...prev, pincode: event.target.value }))
                  }
                />
                <button type="submit" className="cart-address-submit">
                  Add address
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CartPage;

