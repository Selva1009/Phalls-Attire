"use client";

import { API_BASE_URL } from "@/lib/api";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from "@/app/LandingPage/Footer";
import styles from "./product-detail.module.css";

const ProductDetail = () => {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [customerId, setCustomerId] = useState(null);
  const [cart, setCart] = useState([]);

  // Fetch customer data and cart details from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedCustomer = localStorage.getItem("customerUser");
      const customerData = storedCustomer ? JSON.parse(storedCustomer) : null;
      if (customerData) {
        setCustomerId(customerData.id);
      }

      // Load cart from localStorage
      const storedCart =
        JSON.parse(localStorage.getItem(`cart_${customerData?.id}`)) || [];
      setCart(storedCart);
    }
  }, []);

  // Fetch product details from API
  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/auth/products/get-product/${id}`
        );
        if (!res.ok) throw new Error("Failed to fetch product");
        const data = await res.json();
        setProduct(data.product);
      } catch (err) {
        setError("Error fetching product details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!product?.id) return;

    const fetchSuggestions = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/products/get-products/all`);
        if (!res.ok) return;
        const data = await res.json();
        const products = Array.isArray(data.products) ? data.products : [];
        const filtered = products.filter(
          (item) => Number(item.id) !== Number(product.id)
        );
        const matches = filtered.filter(
          (item) => item.category && item.category === product.category
        );
        const shortlist = (matches.length ? matches : filtered).slice(0, 20);
        setSuggestions(shortlist);
      } catch (err) {
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [product]);

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!customerId) {
      toast.error("Please log in to add products to your cart.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    try {
      const cartItem = {
        customerId: customerId,
        productId: product.id,
        quantity: 1,
      };

      const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(cartItem),
      });
      if (response.status === 401) {
        window.location.href = "/SignIn";
        return;
      }

      const data = await response.json();
      console.log("Add to Cart Response:", data);

      if (data.success) {
        const newCart = [...cart, { ...product, quantity: 1 }];
        setCart(newCart);
        localStorage.setItem(`cart_${customerId}`, JSON.stringify(newCart));

        window.dispatchEvent(new Event("storage"));

        toast.success("Product added to cart!", {
          position: "bottom-right",
          autoClose: 1000,
        });
      } else {
        toast.error(`Failed to add product: ${data.message}`, {
          position: "top-right",
          autoClose: 1000,
        });
      }
    } catch (err) {
      console.error("Error adding product to cart:", err);
      toast.error("Error adding product to cart.", {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };


  if (loading) return <p className={styles.stateMessage}>Loading...</p>;
  if (error) return <p className={`${styles.stateMessage} ${styles.stateError}`}>{error}</p>;
  if (!product) return null;

  return (
    <>
      <Navbar disableFilters={true} disableSearch={true} />
      <ToastContainer />
      <main className={styles.pageShell}>
        <section className={styles.detailSection}>
          <div className={styles.mediaPanel}>
            <div className={styles.mediaFrame}>
              <img
                src={
                  product.productImage
                    ? `${API_BASE_URL}/uploads/${product.productImage}`
                    : "/CordSet1 (21).jpeg"
                }
                alt={product.productName}
                className={styles.productImage}
              />
            </div>

            <div className={styles.actionStack}>
              <button onClick={handleAddToCart} className={styles.cartButton}>
                Add to Cart
              </button>
            </div>
          </div>

          <div className={styles.contentPanel}>
            <div className={styles.contentHeader}>
              <span className={styles.eyebrow}>Product</span>
              <h1 className={styles.productTitle}>{product.productName}</h1>
              <div className={styles.metaRow}>
                <span className={styles.categoryChip}>{product.category || "Signature edit"}</span>
                <span className={styles.brandChip}>{product.brand || "Phalls"}</span>
              </div>
              <p className={styles.priceValue}>
                Rs. {Number(product.price || 0).toLocaleString("en-IN")}
              </p>
            </div>

            <div className={styles.infoGrid}>
              <div className={styles.infoCard}>
                <p className={styles.infoLabel}>Seller</p>
                <p className={styles.infoValue}>{product.seller || "Premium Partner"}</p>
              </div>
              <div className={styles.infoCard}>
                <p className={styles.infoLabel}>Category</p>
                <p className={styles.infoValue}>{product.category || "Curated"}</p>
              </div>
              <div className={styles.infoCardFull}>
                <p className={styles.infoLabel}>Description</p>
                <p className={styles.infoValue}>{product.description || "Premium dress edit."}</p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.suggestionSection}>
          <div className={styles.suggestionHeader}>
            <div>
              <span className={styles.suggestionEyebrow}>Suggestions</span>
              <h2>More dresses you may like</h2>
              <p>Curated picks from the same category to keep your look cohesive.</p>
            </div>
            <button
              type="button"
              className={styles.suggestionButton}
              onClick={() => router.push("/customer/products#explore")}
            >
              View all
            </button>
          </div>

          <div className={styles.suggestionGrid}>
            {suggestions.map((item) => (
              <article
                key={item.id}
                className={styles.suggestionCard}
                onClick={() => router.push(`/customer/product/${item.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    router.push(`/customer/product/${item.id}`);
                  }
                }}
              >
                <div className={styles.suggestionImageWrap}>
                  <img
                    src={
                      item.productImage
                        ? `${API_BASE_URL}/uploads/${item.productImage}`
                        : item.localImage || "/CordSet1 (24).jpeg"
                    }
                    alt={item.productName}
                  />
                </div>
                <div className={styles.suggestionBody}>
                  <h3>{item.productName || "Signature dress"}</h3>
                  <p>{item.category || "Curated edit"}</p>
                  <span>
                    Rs. {Number(item.price || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default ProductDetail;
