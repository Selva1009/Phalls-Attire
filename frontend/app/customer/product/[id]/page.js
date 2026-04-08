"use client";

import { API_BASE_URL } from "@/lib/api";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import AuthModal from "../../components/AuthModal";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./product-detail.module.css";
import {
  clearAuthRedirect,
  hasBrowseAccess,
  hasFullCustomerAuth,
  setAuthRedirect,
} from "@/lib/customerSession";

const ProductDetail = () => {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [customerId, setCustomerId] = useState(null);
  const [cart, setCart] = useState([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState("login");
  const [isAuthed, setIsAuthed] = useState(() => hasBrowseAccess());
  const [pendingRoute, setPendingRoute] = useState("");
  const imageCacheBuster = useMemo(() => Date.now(), []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedCustomer = localStorage.getItem("customerUser");
      const customerData = storedCustomer ? JSON.parse(storedCustomer) : null;
      if (customerData) setCustomerId(customerData.id);
      const storedCart =
        JSON.parse(localStorage.getItem(`cart_${customerData?.id}`)) || [];
      setCart(storedCart);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    const authed = hasBrowseAccess();
    setIsAuthed(authed);
    if (!authed) {
      setAuthTab("login");
      setAuthOpen(true);
      setAuthRedirect(`/customer/product/${id}`);
    }
  }, [id]);

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

  const syncCustomerFromStorage = () => {
    if (typeof window === "undefined") return;
    const storedCustomer = localStorage.getItem("customerUser");
    const customerData = storedCustomer ? JSON.parse(storedCustomer) : null;
    if (customerData) {
      setCustomerId(customerData.id);
      const storedCart =
        JSON.parse(localStorage.getItem(`cart_${customerData?.id}`)) || [];
      setCart(storedCart);
    }
  };

  const openAuthModal = (mode = "login", route = "") => {
    setAuthTab(mode);
    setAuthOpen(true);
    const targetRoute = route || (id ? `/customer/product/${id}` : "");
    if (targetRoute) {
      setPendingRoute(targetRoute);
      setAuthRedirect(targetRoute);
    }
  };

  const handleLoginSuccess = (data) => {
    setAuthOpen(false);
    clearAuthRedirect();
    if (data.userType === "vendor-user") {
      router.push("/vendorUser");
      return;
    }
    const nextRoute = pendingRoute;
    setPendingRoute("");
    if (nextRoute && nextRoute !== `/customer/product/${id}`) {
      router.push(nextRoute);
      return;
    }
    setIsAuthed(true);
    syncCustomerFromStorage();
  };

  const handleSignupSuccess = () => {
    setAuthOpen(false);
    setPendingRoute("");
    clearAuthRedirect();
    router.push("/customer/products");
  };

  const handleAddToCart = async () => {
    if (!hasFullCustomerAuth() || !customerId) {
      openAuthModal("login");
      return;
    }
    try {
      const cartItem = { customerId, productId: product.id, quantity: 1 };
      const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(cartItem),
      });
      if (response.status === 401) {
        openAuthModal("login");
        return;
      }
      const data = await response.json();
      if (data.success) {
        const newCart = [...cart, { ...product, quantity: 1 }];
        setCart(newCart);
        localStorage.setItem(`cart_${customerId}`, JSON.stringify(newCart));
        window.dispatchEvent(new Event("storage"));
        toast.success("Added to your Cart.", {
          position: "bottom-right",
          autoClose: 1500,
        });
      } else {
        toast.error(`${data.message}`, { position: "top-right", autoClose: 1000 });
      }
    } catch (err) {
      toast.error("Something went wrong.", { position: "top-right", autoClose: 2000 });
    }
  };

  if (loading)
    return (
      <div className={styles.loadingScreen}>
        <span className={styles.loadingDot} />
        <span className={styles.loadingDot} />
        <span className={styles.loadingDot} />
      </div>
    );
  if (error)
    return <p className={styles.errorScreen}>{error}</p>;
  if (!product) return null;

  if (!isAuthed) {
    return (
      <>
        <Navbar
          disableFilters={true}
          disableSearch={true}
          variant="home"
          onAuthTrigger={openAuthModal}
        />

        <div className={styles.lockedShell}>
          <div className={styles.lockedCard}>
            <span className={styles.lockedEyebrow}>Members only</span>
            <h1 className={styles.lockedTitle}>Sign in to view this product</h1>
            <p className={styles.lockedText}>
              Explore full product details, premium edits, and quick actions by
              logging in or creating your account.
            </p>
            <div className={styles.lockedActions}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => openAuthModal("login")}
              >
                Login to Continue
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => openAuthModal("signup")}
              >
                Create Account
              </button>
            </div>
          </div>
        </div>

        <AuthModal
          open={authOpen}
          initialTab={authTab}
          onClose={() => setAuthOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          onSignupSuccess={handleSignupSuccess}
        />
      </>
    );
  }

  return (
    <>
      <Navbar
        disableFilters={true}
        disableSearch={true}
        variant="home"
        onAuthTrigger={openAuthModal}
      />
      <ToastContainer />

      <main className={styles.shell}>

        {/* ── HERO SPLIT ── */}
        <section className={styles.hero}>

          {/* Left: image */}
          <div className={styles.imageSide}>
            <div className={styles.imageWrap}>
              <img
                src={
                  product.productImage
                    ? `${API_BASE_URL}/uploads/${product.productImage}?v=${imageCacheBuster}`
                    : "/CordSet1 (21).jpeg"
                }
                alt={product.productName}
                className={styles.heroImage}
              />
              <div className={styles.imageFade} />
            </div>

            {/* floating tag */}
            {/* <div className={styles.floatingTag}> */}
              {/* <span>Signature Edit</span> */}
            {/* </div> */}
          </div>

          {/* Right: info */}
          <div className={styles.infoSide}>
            <div className={styles.infoInner}>

              <p className={styles.overline}>
                {product.brand || "Phalls"} &nbsp;/&nbsp; {product.seller || "Premium Partner"}
              </p>

              <h1 className={styles.title}>{product.productName}</h1>

              <div className={styles.dividerLine} />

              <p className={styles.price}>
                ₹{Number(product.price || 0).toLocaleString("en-IN")}
              </p>

              <p className={styles.description}>
                {product.description || "A premium dress edit crafted for the modern woman."}
              </p>

              <div className={styles.metaList}>
                <div className={styles.metaItem}>
                  <span className={styles.metaKey}>Category</span>
                  <span className={styles.metaVal}>{product.category || "Curated"}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaKey}>Brand</span>
                  <span className={styles.metaVal}>{product.brand || "Phalls"}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaKey}>Seller</span>
                  <span className={styles.metaVal}>{product.seller || "Premium Partner"}</span>
                </div>
              </div>

              <button onClick={handleAddToCart} className={styles.cartBtn}>
                <span>Add to Cart</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
              </button>

            </div>
          </div>
        </section>

        {/* ── YOU MAY ALSO LIKE ── */}
        {suggestions.length > 0 && (
          <section className={styles.suggest}>
            <div className={styles.suggestHead}>
              <div className={styles.suggestHeadLeft}>
                <p className={styles.suggestOverline}>Styled for you</p>
                <h2 className={styles.suggestTitle}>You may also love</h2>
              </div>
              <button
                className={styles.viewAllBtn}
                onClick={() => router.push("/customer/products#explore")}
              >
                View all
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className={styles.suggestTrack}>
              {suggestions.map((item, i) => (
                <article
                  key={item.id}
                  className={styles.suggestCard}
                  style={{ "--i": i }}
                  onClick={() => {
                    if (!hasBrowseAccess()) {
                      openAuthModal("login", `/customer/product/${item.id}`);
                      return;
                    }
                    router.push(`/customer/product/${item.id}`);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (!hasBrowseAccess()) {
                        openAuthModal("login", `/customer/product/${item.id}`);
                        return;
                      }
                      router.push(`/customer/product/${item.id}`);
                    }
                  }}
                >
                  <div className={styles.suggestImgBox}>
                    <img
                      src={
                        item.productImage
                          ? `${API_BASE_URL}/uploads/${item.productImage}?v=${imageCacheBuster}`
                          : item.localImage || "/CordSet1 (24).jpeg"
                      }
                      alt={item.productName}
                      className={styles.suggestImg}
                    />
                    <div className={styles.suggestOverlay}>
                      <span className={styles.suggestQuickLook}>Quick look</span>
                    </div>
                  </div>
                  <div className={styles.suggestInfo}>
                    <p className={styles.suggestName}>{item.productName || "Signature Dress"}</p>
                    <p className={styles.suggestCat}>{item.category || "Curated"}</p>
                    <p className={styles.suggestPrice}>
                      ₹{Number(item.price || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      <AuthModal
        open={authOpen}
        initialTab={authTab}
        onClose={() => setAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onSignupSuccess={handleSignupSuccess}
      />
    </>
  );
};

export default ProductDetail;
