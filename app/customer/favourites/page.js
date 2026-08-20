"use client";

import { API_BASE_URL, getProductImageSource } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import Navbar from "@/app/customer/components/Navbar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const formatPrice = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

export default function FavouritePage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const imageCacheBuster = useMemo(() => Date.now(), []);

  /* ── Fetch wishlist ── */
  useEffect(() => {
    const fetchWishlist = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setWishlist([]);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/api/favourites`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 401) {
          router.push("/Home");
          return;
        }
        const data = await response.json();
        if (response.ok) {
          const favourites = Array.isArray(data.favourites) ? data.favourites : [];
          setWishlist(
            favourites
              .map((item) => item?.product?.product_id)
              .filter((id) => Number.isFinite(id))
          );
        } else {
          setWishlist([]);
        }
      } catch {
        setWishlist([]);
      }
    };
    fetchWishlist();
  }, []);

  /* ── Load customer + cart ── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedCustomer = localStorage.getItem("customerUser");
      const customerData = storedCustomer ? JSON.parse(storedCustomer) : null;
      if (customerData?.id) {
        setCustomerId(customerData.id);
        const storedCart = JSON.parse(
          localStorage.getItem(`cart_${customerData.id}`) || "[]"
        );
        setCartItems(Array.isArray(storedCart) ? storedCart : []);
      }
    } catch {
      setCustomerId(null);
      setCartItems([]);
    }
  }, []);

  /* ── Fetch all products ── */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/auth/products/get-products/all`
        );
        const data = await response.json();
        if (response.ok) {
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error("Error fetching favourite products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const favouriteProducts = useMemo(
    () => products.filter((product) => wishlist.includes(product.id)),
    [products, wishlist]
  );

  /* ── Remove from favourites ── */
  const removeFromFavourites = (productId) => {
    const remove = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/Home");
        return;
      }
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/favourites/${productId}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.status === 401) {
          router.push("/Home");
          return;
        }
        if (!response.ok) throw new Error("Failed to remove favourite");
        setWishlist((prev) => prev.filter((id) => id !== productId));
        window.dispatchEvent(new Event("wishlistUpdated"));
      } catch {
        toast.error("Failed to remove favourite.");
      }
    };
    remove();
  };

  /* ── Add to cart ── */
  const handleAddToCart = async (product) => {
    if (!customerId) {
      toast.error("Please sign in to add items to your cart.", {
        position: "top-right",
        autoClose: 1600,
      });
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ customerId, productId: product.id, quantity: 1 }),
      });
      if (response.status === 401) {
        router.push("/Home");
        return;
      }
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to add to cart");
      }
      const updatedCart = [...cartItems, { ...product, quantity: 1 }];
      setCartItems(updatedCart);
      localStorage.setItem(`cart_${customerId}`, JSON.stringify(updatedCart));
      window.dispatchEvent(new Event("storage"));
      toast.success("Added to cart.", {
        position: "bottom-right",
        autoClose: 1200,
      });
    } catch (error) {
      toast.error(error.message || "Failed to add to cart.", {
        position: "top-right",
        autoClose: 1600,
      });
    }
  };

  /* ── Render ── */
  return (
    <>
      <Navbar disableFilters disableSearch hideCategories />
      <ToastContainer theme="dark" />

      <div className="nb-page">
        <div className="nb-shell">

          {/* Hero */}
          <header className="nb-hero">
            <div>
              <div className="nb-eyebrow">
                <span className="nb-eyebrow-text">My Wishlist</span>
              </div>
              <h1 className="nb-hero-title">
                Pieces you&apos;ve<br />
                <em>fallen for</em>
              </h1>
              <p className="nb-hero-sub">
                Your curated collection, saved and waiting.
              </p>
            </div>

            {!loading && favouriteProducts.length > 0 && (
              <div className="nb-count-wrap">
                <span className="nb-count-num">
                  {String(favouriteProducts.length).padStart(2, "0")}
                </span>
                <span className="nb-count-label">Saved pieces</span>
              </div>
            )}
          </header>

          {/* Content */}
          {loading ? (
            <div className="nb-loading">
              <div className="nb-loading-bars">
                <div className="nb-loading-bar" />
                <div className="nb-loading-bar" />
                <div className="nb-loading-bar" />
                <div className="nb-loading-bar" />
                <div className="nb-loading-bar" />
              </div>
              <p>Curating your collection</p>
            </div>

          ) : favouriteProducts.length > 0 ? (
            <div className="nb-section">
              <section className="nb-grid">
                {favouriteProducts.map((product) => (
                  <article key={product.id} className="nb-card">
                    {/* Image */}
                    <div className="nb-card-img-wrap">
                      <img
                        src={getProductImageSource(product, imageCacheBuster) || "/CordSet1 (21).jpeg"}
                        alt={product.productName}
                        className="nb-card-img"
                        onError={(event) => {
                          event.currentTarget.src = "/CordSet1 (21).jpeg";
                        }}
                      />

                      {/* Hover overlay */}
                      <div className="nb-card-overlay">
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          className="nb-overlay-btn"
                        >
                          <ShoppingBag size={13} />
                          Add to Bag
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeFromFavourites(product.id)}
                        className="nb-remove-pill"
                        aria-label="Remove from favourites"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Body */}
                    <div className="nb-card-divider" />
                    <div className="nb-card-body">
                      <h3 className="nb-card-name">{product.productName}</h3>
                      <div className="nb-card-meta">
                        <span className="nb-price">{formatPrice(product.price)}</span>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          className="nb-add-btn"
                        >
                          <ShoppingBag size={11} />
                          Add to Bag
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </section>

              {/* Bottom bar */}
              <div className="nb-bottom-bar">
                <button
                  type="button"
                  className="nb-clear-btn"
                  onClick={() => {
                    favouriteProducts.forEach((p) => removeFromFavourites(p.id));
                  }}
                >
                  <Trash2 size={12} />
                  Clear all
                </button>
                <button
                  type="button"
                  className="nb-shop-btn"
                  onClick={() => router.push("/Home#explore")}
                >
                  Continue shopping
                </button>
              </div>
            </div>

          ) : (
            <div className="nb-empty">
              <div className="nb-empty-ring">
                <Heart size={28} />
              </div>
              <h2>Nothing saved yet</h2>
              <p>
                Tap the heart on any piece you love and it will live here,
                waiting for you.
              </p>
            </div>
          )}

        </div>
      </div>

    </>
  );
}

