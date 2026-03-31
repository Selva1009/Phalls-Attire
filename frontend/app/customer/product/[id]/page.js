"use client";

import { API_BASE_URL } from "@/lib/api";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Footer from "@/app/LandingPage/Footer";
import styles from "./product-detail.module.css";

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
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
                src={`${API_BASE_URL}/uploads/${product.productImage}`}
                alt={product.productName}
                className={styles.productImage}
              />
            </div>

            <button onClick={handleAddToCart} className={styles.cartButton}>
              Add to Cart
            </button>
          </div>

          <div className={styles.contentPanel}>
            <span className={styles.eyebrow}>Product Details</span>
            <h1 className={styles.productTitle}>{product.productName}</h1>
            <p className={styles.priceValue}>
              Price: Rs. {Number(product.price || 0).toLocaleString("en-IN")}
            </p>
            <div className={styles.infoList}>
              <p className={styles.infoRow}>
                <span className={styles.infoLabel}>Brand</span>
                <span className={styles.infoValue}>{product.brand}</span>
              </p>
              <p className={styles.infoRow}>
                <span className={styles.infoLabel}>Category</span>
                <span className={styles.infoValue}>{product.category}</span>
              </p>
              <p className={styles.infoRow}>
                <span className={styles.infoLabel}>Description</span>
                <span className={styles.infoValue}>{product.description}</span>
              </p>
              <p className={styles.infoRow}>
                <span className={styles.infoLabel}>Seller</span>
                <span className={styles.infoValue}>{product.seller}</span>
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
};

export default ProductDetail;
