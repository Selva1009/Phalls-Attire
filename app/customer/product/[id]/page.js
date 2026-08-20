"use client";

import { API_BASE_URL, getProductImageSource } from "@/lib/api";
import { useState, useEffect, useMemo, useRef } from "react";
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

const buildImageUrl = (product, cacheKey = "") => {
  const imageUrl = getProductImageSource(product, cacheKey);
  if (!imageUrl) {
    const isFallback =
      typeof product?.id === "string" && product.id.startsWith("fallback-");
    return isFallback ? product?.localImage || "/CordSet1 (21).jpeg" : "/notfound.jpg";
  }
  return imageUrl;
};

const ProductDetail = () => {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [customerId, setCustomerId] = useState(null);
  const [cart, setCart] = useState([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState("login");
  const [isAuthed, setIsAuthed] = useState(() => hasBrowseAccess());
  const [pendingRoute, setPendingRoute] = useState("");
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const suggestTrackRef = useRef(null);
  const imageCacheBuster = useMemo(() => Date.now(), []);

  const normalizeCategory = (value) => String(value || "").trim().toLowerCase();

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
      setAuthTab("signup");
      setAuthOpen(true);
      setAuthRedirect(`/customer/product/${id}`);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    let isActive = true;
    const fetchProduct = async () => {
      setLoading(true);
      setError("");

      const findCachedProduct = () => {
        if (typeof window === "undefined") return null;
        const cachedProducts = sessionStorage.getItem("customerProductsCache");
        if (!cachedProducts) return null;
        try {
          const parsed = JSON.parse(cachedProducts);
          if (!Array.isArray(parsed)) return null;
          return parsed.find((item) => String(item.id) === String(id)) || null;
        } catch {
          return null;
        }
      };

      try {
        const res = await fetch(
          `${API_BASE_URL}/api/auth/products/get-product/${id}`,
          { cache: "no-store" }
        );
        if (!res.ok) {
          throw new Error("Failed to fetch product");
        }
        const data = await res.json();
        if (isActive) {
          setProduct(data.product);
        }
      } catch (err) {
        const cachedMatch = findCachedProduct();
        if (isActive) {
          if (cachedMatch) {
            setProduct(cachedMatch);
          } else {
            setError("Error fetching product details.");
          }
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };
    fetchProduct();
    return () => {
      isActive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!product?.id) return;
    let isActive = true;
    const fetchSuggestions = async () => {
      const buildSuggestions = (items) => {
        const filtered = items.filter(
          (item) => String(item.id) !== String(product.id)
        );
        const productCategory = normalizeCategory(product.category);
        const matches = filtered.filter(
          (item) => productCategory && normalizeCategory(item.category) === productCategory
        );
        return {
          matches,
          shortlist: (matches.length ? matches : filtered).slice(0, 20),
        };
      };

      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/products/get-products/all`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load products");
        const data = await res.json();
        const products = Array.isArray(data.products) ? data.products : [];
        if (!isActive) return;
        const { matches, shortlist } = buildSuggestions(products);
        setCategorySuggestions(matches);
        setSuggestions(shortlist);
      } catch (err) {
        if (!isActive) return;
        const cachedProducts = (() => {
          if (typeof window === "undefined") return [];
          const cached = sessionStorage.getItem("customerProductsCache");
          if (!cached) return [];
          try {
            const parsed = JSON.parse(cached);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })();
        const { matches, shortlist } = buildSuggestions(cachedProducts);
        setCategorySuggestions(matches);
        setSuggestions(shortlist);
      }
    };
    fetchSuggestions();
    return () => {
      isActive = false;
    };
  }, [product]);

  const imageSlides = useMemo(() => {
    if (!product) return [];
    const map = new Map();
    map.set(String(product.id), product);
    categorySuggestions.forEach((item) => {
      const key = String(item.id);
      if (map.has(key)) return;
      map.set(key, item);
    });
    return Array.from(map.values());
  }, [categorySuggestions, product]);

  const displayedProduct = imageSlides[activeImageIndex] || product;

  useEffect(() => {
    setActiveImageIndex(0);
  }, [product?.id]);

  useEffect(() => {
    if (!imageSlides.length) return;
    setActiveImageIndex((prev) => Math.min(prev, imageSlides.length - 1));
  }, [imageSlides.length]);

  const handleImageSlide = (direction) => {
    if (imageSlides.length <= 1) return;
    setActiveImageIndex((prev) => {
      const next = direction === "left" ? prev - 1 : prev + 1;
      const total = imageSlides.length;
      return (next + total) % total;
    });
  };

  useEffect(() => {
    const track = suggestTrackRef.current;
    if (!track) return;

    const updateScrollState = () => {
      const { scrollLeft, scrollWidth, clientWidth } = track;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
    };

    updateScrollState();
    track.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      track.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [suggestions]);

  const handleTrackScroll = (direction) => {
    const track = suggestTrackRef.current;
    if (!track) return;
    const scrollAmount = Math.max(220, Math.floor(track.clientWidth * 0.6));
    track.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

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
    router.push("/Home");
  };

  const handleAddToCart = async () => {
    const targetProduct = displayedProduct || product;
    if (!targetProduct) return;
    if (!hasFullCustomerAuth() || !customerId) {
      openAuthModal("signup");
      return;
    }
    try {
      const cartItem = { customerId, productId: targetProduct.id, quantity: 1 };
      const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(cartItem),
      });
      if (response.status === 401) {
        openAuthModal("signup");
        return;
      }
      const data = await response.json();
      if (data.success) {
        const newCart = [...cart, { ...targetProduct, quantity: 1 }];
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
                onClick={() => openAuthModal("signup")}
              >
                Create Account
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => openAuthModal("login")}
              >
                Login
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
              {imageSlides.length > 1 && (
                <div className={styles.imageNav}>
                  <button
                    type="button"
                    className={styles.imageNavButton}
                    onClick={() => handleImageSlide("left")}
                    aria-label="Previous image"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 6l-6 6 6 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={styles.imageNavButton}
                    onClick={() => handleImageSlide("right")}
                    aria-label="Next image"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </button>
                </div>
              )}
              <img
                src={buildImageUrl(
                  displayedProduct,
                  `${imageCacheBuster}-${displayedProduct?.id || ""}`
                )}
                alt={displayedProduct?.productName || product.productName}
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
                {displayedProduct?.brand || "Phalls"} &nbsp;/&nbsp; {displayedProduct?.seller || "Premium Partner"}
              </p>

              <h1 className={styles.title}>{displayedProduct?.productName || product.productName}</h1>

              <div className={styles.dividerLine} />

              <p className={styles.price}>
                Rs. {Number(displayedProduct?.price || 0).toLocaleString("en-IN")}
              </p>

              <p className={styles.description}>
                {displayedProduct?.description || "A premium dress edit crafted for the modern woman."}
              </p>

              <div className={styles.metaList}>
                <div className={styles.metaItem}>
                  <span className={styles.metaKey}>Category</span>
                  <span className={styles.metaVal}>{displayedProduct?.category || "Curated"}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaKey}>Brand</span>
                  <span className={styles.metaVal}>{displayedProduct?.brand || "Phalls"}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaKey}>Seller</span>
                  <span className={styles.metaVal}>{displayedProduct?.seller || "Premium Partner"}</span>
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
              <div className={styles.suggestActions}>
                <div className={styles.suggestControls}>
                  <button
                    type="button"
                    className={styles.suggestArrow}
                    onClick={() => handleTrackScroll("left")}
                    disabled={!canScrollLeft}
                    aria-label="Scroll left"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M15 6l-6 6 6 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className={styles.suggestArrow}
                    onClick={() => handleTrackScroll("right")}
                    disabled={!canScrollRight}
                    aria-label="Scroll right"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </button>
                </div>
                <button
                  className={styles.viewAllBtn}
                  onClick={() => router.push("/Home#explore")}
                >
                  View all
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className={styles.suggestTrack} ref={suggestTrackRef}>
              {suggestions.map((item, i) => (
                <article
                  key={item.id}
                  className={styles.suggestCard}
                  style={{ "--i": i }}
                  onClick={() => {
                    if (!hasBrowseAccess()) {
                      openAuthModal("signup", `/customer/product/${item.id}`);
                      return;
                    }
                    router.push(`/customer/product/${item.id}`);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (!hasBrowseAccess()) {
                        openAuthModal("signup", `/customer/product/${item.id}`);
                        return;
                      }
                      router.push(`/customer/product/${item.id}`);
                    }
                  }}
                >
                  <div className={styles.suggestImgBox}>
                    <img
                      src={buildImageUrl(
                        item,
                        `${imageCacheBuster}-${item.id || ""}`
                      )}
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
                      Rs. {Number(item.price || 0).toLocaleString("en-IN")}
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
