"use client";

import { API_BASE_URL } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { Heart, Loader2, Trash2 } from "lucide-react";
import Navbar from "@/app/customer/components/Navbar";
import Footer from "@/app/LandingPage/Footer";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const formatPrice = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

export default function FavouritePage() {
  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState(null);
  const [cartItems, setCartItems] = useState([]);

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
          window.location.href = "/SignIn";
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
      } catch (error) {
        setWishlist([]);
      }
    };

    fetchWishlist();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const storedCustomer = localStorage.getItem("customerUser");
      const customerData = storedCustomer ? JSON.parse(storedCustomer) : null;
      if (customerData?.id) {
        setCustomerId(customerData.id);
        const storedCart = JSON.parse(localStorage.getItem(`cart_${customerData.id}`) || "[]");
        setCartItems(Array.isArray(storedCart) ? storedCart : []);
      }
    } catch (error) {
      setCustomerId(null);
      setCartItems([]);
    }
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/products/get-products/all`);
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

  const removeFromFavourites = (productId) => {
    const remove = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/SignIn";
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/favourites/${productId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 401) {
          window.location.href = "/SignIn";
          return;
        }
        if (!response.ok) {
          throw new Error("Failed to remove favourite");
        }
        const updatedWishlist = wishlist.filter((id) => id !== productId);
        setWishlist(updatedWishlist);
        window.dispatchEvent(new Event("wishlistUpdated"));
      } catch (error) {
        toast.error("Failed to remove favourite.");
      }
    };

    remove();
  };

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
        window.location.href = "/SignIn";
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

  return (
    <>
      <Navbar disableFilters disableSearch />
      <ToastContainer />
      <div className="favourite-page">
        <div className="favourite-shell">
          <header className="favourite-header">
            <div className="favourite-header-icon">
              <Heart size={24} fill="currentColor" />
            </div>
            <div>
              <p className="favourite-section-label">Favourite</p>
              <h1>Saved styles you can return to anytime.</h1>
            </div>
          </header>

          {loading ? (
            <div className="favourite-loading">
              <Loader2 className="favourite-spinner" />
            </div>
          ) : favouriteProducts.length > 0 ? (
            <section className="favourite-grid">
              {favouriteProducts.map((product) => (
                <article key={product.id} className="favourite-card">
                  <div className="favourite-image-wrap">
                    <img
                      src={
                        product.productImage
                          ? `${API_BASE_URL}/uploads/${product.productImage}`
                          : "/CordSet1 (21).jpeg"
                      }
                      alt={product.productName}
                      className="favourite-image"
                    />
                  </div>

                  <div className="favourite-card-body">
                    <div>
                      <h3>{product.productName}</h3>
                      <p>{formatPrice(product.price)}</p>
                    </div>
                    <div className="favourite-card-actions">
                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        className="favourite-cart-button"
                      >
                        Add to cart
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromFavourites(product.id)}
                        className="favourite-remove-button"
                      >
                        <Trash2 size={16} />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          ) : (
            <div className="favourite-empty-card">
              <h2>No favourites saved yet</h2>
              <p>Tap the heart on a product card and it will appear here.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
