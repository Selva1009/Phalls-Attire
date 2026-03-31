"use client";

import { API_BASE_URL } from "@/lib/api";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Heart, Star } from "lucide-react";
import Navbar from "../components/Navbar";
import styles from "./customer-page.module.css";

const PRODUCTS_PER_PAGE = 20;

const curatedCategories = [
  {
    name: "Women's Tops",
    description: "Daily essentials, polished fits, and easy-to-style wardrobe staples.",
    label: "Everyday wear",
  },
  {
    name: "Exquisite Churidar Suits",
    description: "Refined ethnic sets designed for festive dressing and elegant occasions.",
    label: "Festive edit",
  },
  {
    name: "Premium Co-Ord Sets",
    description: "Coordinated looks built for effortless styling and quick outfit decisions.",
    label: "Best seller",
  },
  {
    name: "Designer Gowns",
    description: "Statement silhouettes for celebrations, evening events, and dressy moments.",
    label: "Occasion wear",
  },
  {
    name: "Kurta Pant Dupatta Sets",
    description: "Complete ethnic combinations with balanced comfort and a graceful finish.",
    label: "Traditional set",
  },
  {
    name: "Nightwear Trio Sets",
    description: "Comfort-led homewear curated for softer fabrics and relaxed styling.",
    label: "Comfort picks",
  },
  {
    name: "Pure Cotton Nightwear",
    description: "Breathable cotton sleepwear focused on comfort, ease, and all-day softness.",
    label: "Cotton essentials",
  },
  {
    name: "Designer Sarees",
    description: "Modern and festive saree edits selected for polished drape and occasion style.",
    label: "Premium drapes",
  },
  {
    name: "Signature Leggings",
    description: "Versatile bottomwear for layering, casual styling, and everyday movement.",
    label: "Core basics",
  },
];

const testimonials = [
  {
    name: "Aanya S.",
    role: "Style Consultant",
    quote:
      "The experience feels editorial and effortless. I find premium picks here faster than on most marketplaces.",
  },
  {
    name: "Mithra R.",
    role: "Founder",
    quote:
      "The layout feels calm and refined, and the product discovery flow actually makes me want to keep scrolling.",
  },
  {
    name: "Diya M.",
    role: "Content Creator",
    quote:
      "It has the polish of a luxury storefront with the ease of a social shopping app.",
  },
];

const fallbackProducts = [
  {
    id: "fallback-top-1",
    productName: "Rose Everyday Top",
    brand: "Phalls Attair",
    seller: "Phalls Attair",
    description: "Soft daily-wear top with a polished feminine silhouette.",
    category: "Women's Tops",
    price: 1299,
    productImage: "",
    localImage: "/CordSet1 (3).jpeg",
  },
  {
    id: "fallback-suit-1",
    productName: "Festive Churidar Set",
    brand: "Phalls Attair",
    seller: "Phalls Attair",
    description: "Elegant churidar suit set for festive and occasion dressing.",
    category: "Exquisite Churidar Suits",
    price: 2499,
    productImage: "",
    localImage: "/CordSet1 (10).jpeg",
  },
  {
    id: "fallback-coord-1",
    productName: "Blush Co-Ord Edit",
    brand: "Phalls Attair",
    seller: "Phalls Attair",
    description: "Comfortable co-ord set made for quick styling.",
    category: "Premium Co-Ord Sets",
    price: 1899,
    productImage: "",
    localImage: "/CordSet02.jpeg",
  },
  {
    id: "fallback-gown-1",
    productName: "Evening Designer Gown",
    brand: "Phalls Attair",
    seller: "Phalls Attair",
    description: "Statement gown for premium evening occasions.",
    category: "Designer Gowns",
    price: 3599,
    productImage: "",
    localImage: "/CordSet1 (20).jpeg",
  },
  {
    id: "fallback-kurta-1",
    productName: "Kurta Pant Dupatta Classic",
    brand: "Phalls Attair",
    seller: "Phalls Attair",
    description: "Graceful ethnic set with kurta, pant, and dupatta.",
    category: "Kurta Pant Dupatta Sets",
    price: 2199,
    productImage: "",
    localImage: "/CordSet1 (24).jpeg",
  },
  {
    id: "fallback-night-1",
    productName: "Cotton Nightwear Set",
    brand: "Phalls Attair",
    seller: "Phalls Attair",
    description: "Breathable cotton nightwear made for comfort.",
    category: "Pure Cotton Nightwear",
    price: 999,
    productImage: "",
    localImage: "/CordSet1 (29).jpeg",
  },
  {
    id: "fallback-saree-1",
    productName: "Signature Designer Saree",
    brand: "Phalls Attair",
    seller: "Phalls Attair",
    description: "Elegant saree crafted for premium celebrations.",
    category: "Designer Sarees",
    price: 2899,
    productImage: "",
    localImage: "/CordSet1 (30).jpeg",
  },
  {
    id: "fallback-legging-1",
    productName: "Signature Stretch Leggings",
    brand: "Phalls Attair",
    seller: "Phalls Attair",
    description: "Everyday leggings with a flexible flattering fit.",
    category: "Signature Leggings",
    price: 699,
    productImage: "",
    localImage: "/CordSet1 (32).jpeg",
  },
];

// const serviceHighlights = [
//   { label: "Curated drops", value: "48h", icon: Sparkles },
//   { label: "Express dispatch", value: "2 Day", icon: Truck },
//   { label: "Loved by members", value: "4.9/5", icon: Star },
// ];

const formatPrice = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const categoryKeywords = {
  "Women's Tops": ["women tops", "womens top", "top", "tops", "blouse", "tshirt", "shirt"],
  "Exquisite Churidar Suits": ["churidar", "churidar suit", "salwar", "salwar suit", "anarkali"],
  "Premium Co-Ord Sets": ["co ord", "co ord set", "coord", "coord set", "co-ord", "co-ord set", "cord set"],
  "Designer Gowns": ["gown", "gowns", "designer gown", "evening gown", "party gown", "maxi dress"],
  "Kurta Pant Dupatta Sets": ["kurta pant dupatta", "kurta set", "kurta pant", "dupatta set", "kurti set"],
  "Nightwear Trio Sets": ["nightwear trio", "nightwear set", "night suit", "sleepwear set", "nighty", "pyjama", "pajama"],
  "Pure Cotton Nightwear": ["cotton nightwear", "cotton sleepwear", "cotton nighty", "cotton pajama", "cotton pyjama"],
  "Designer Sarees": ["saree", "sarees", "designer saree", "silk saree"],
  "Signature Leggings": ["legging", "leggings"],
};

const getProductSearchText = (product) =>
  normalizeText([
    product.category,
    product.brand,
    product.productName,
    product.seller,
    product.description,
  ].join(" "));

const matchesCategory = (product, category) => {
  const normalizedCategory = normalizeText(category);
  const keywords = categoryKeywords[category] || [normalizedCategory];
  const productCategory = normalizeText(product.category);
  const productName = normalizeText(product.productName);
  const productDescription = normalizeText(product.description);

  if (productCategory && productCategory === normalizedCategory) {
    return true;
  }

  if (productCategory && keywords.some((keyword) => productCategory.includes(normalizeText(keyword)))) {
    return true;
  }

  if (keywords.some((keyword) => productName.includes(normalizeText(keyword)))) {
    return true;
  }

  return keywords.some((keyword) => productDescription.includes(normalizeText(keyword)));
};

function ProductCard({ product, onClick, onToggleWishlist, isWishlisted }) {
  const stockStatus = product.stock_status || product.stockStatus || "";
  const stockClass =
    stockStatus === "In Stock"
      ? styles.stockIn
      : stockStatus === "Low Stock"
        ? styles.stockLow
        : stockStatus === "Out of Stock"
          ? styles.stockOut
          : "";

  return (
    <article className={styles.productCard}>
      <div className={styles.productMedia} onClick={() => onClick(product.id)}>
        <img
          src={
            product.productImage
              ? `${API_BASE_URL}/uploads/${product.productImage}`
              : product.localImage || "/CordSet1 (21).jpeg"
          }
          alt={product.productName}
          className={styles.productImage}
        />
        <div className={styles.productOverlay} />
        <button
          type="button"
          className={`${styles.wishlistButton} ${isWishlisted ? styles.wishlisted : ""}`}
          onClick={(event) => {
            event.stopPropagation();
            onToggleWishlist(product.id);
          }}
        >
          <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
        </button>
        <span className={styles.productBadge}>{product.category || "Featured"}</span>
        {stockStatus && (
          <span className={`${styles.stockBadge} ${stockClass}`}>{stockStatus}</span>
        )}
      </div>

      <div className={styles.productBody}>
        <div className={styles.productHeader}>
          <div className={styles.productTitleWrap}>
            <h3 className={styles.productTitle}>{product.productName}</h3>
            <p className={styles.productBrand}>
              {product.brand || product.seller || "Signature Collection"}
            </p>
          </div>
        </div>

        <div className={styles.productFooter}>
          <div>
            {/* <p className={styles.productLabel}>Starting at</p> */}
            <p className={styles.productPrice}>{formatPrice(product.price)}</p>
          </div>
          <button type="button" className={styles.productAction} onClick={() => onClick(product.id)}>
            View
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [wishlist, setWishlist] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const [wishlistLoaded, setWishlistLoaded] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const exploreRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);
    const fetchWishlist = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setWishlistLoaded(true);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/favourites`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 401) {
          setWishlistLoaded(true);
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
        }
      } catch (error) {
        console.error("Failed to load favourites:", error);
      } finally {
        setWishlistLoaded(true);
      }
    };

    fetchWishlist();
  }, []);

  useEffect(() => {
    const categoryFromURL = searchParams.get("category") || "";
    setCategoryFilter(categoryFromURL);
    setCurrentPage(1);
  }, [searchParams]);

  useEffect(() => {
    if (!searchQuery.trim()) return;

    setCurrentPage(1);

    if (categoryFilter) {
      setCategoryFilter("");
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", "/customer/products");
      }
    }

    requestAnimationFrame(() => {
      exploreRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [searchQuery]);

  useEffect(() => {
    if (!isMounted) return;
    window.dispatchEvent(new Event("wishlistUpdated"));
  }, [wishlist, isMounted]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError("");

      const cachedProducts =
        typeof window !== "undefined"
          ? sessionStorage.getItem("customerProductsCache")
          : null;

      if (cachedProducts) {
        try {
          const parsedProducts = JSON.parse(cachedProducts);
          if (Array.isArray(parsedProducts)) {
            setProducts(parsedProducts);
            setLoading(false);
          }
        } catch {
          sessionStorage.removeItem("customerProductsCache");
        }
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/auth/products/get-products/all`
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data || !Array.isArray(data.products)) {
          throw new Error("Invalid API response format");
        }

        setProducts(data.products);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("customerProductsCache", JSON.stringify(data.products));
        }
      } catch (fetchError) {
        setProducts(fallbackProducts);
        setError("");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    let filtered = [...products];

    if (searchQuery) {
      const normalizedQuery = normalizeText(searchQuery);
      filtered = filtered.filter((product) =>
        getProductSearchText(product).includes(normalizedQuery)
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter((product) => matchesCategory(product, categoryFilter));
    }

    if (priceFilter === "low") {
      filtered.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (priceFilter === "high") {
      filtered.sort((a, b) => Number(b.price) - Number(a.price));
    }

    const totalFilteredPages = Math.ceil(filtered.length / PRODUCTS_PER_PAGE) || 1;

    if (currentPage > totalFilteredPages) {
      setCurrentPage(1);
      return;
    }

    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    setDisplayedProducts(filtered.slice(startIndex, startIndex + PRODUCTS_PER_PAGE));
  }, [categoryFilter, currentPage, priceFilter, products, searchQuery]);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        if (searchQuery && !getProductSearchText(product).includes(normalizeText(searchQuery))) {
          return false;
        }

        if (categoryFilter && !matchesCategory(product, categoryFilter)) {
          return false;
        }

        return true;
      }),
    [categoryFilter, products, searchQuery]
  );

  if (!isMounted || !wishlistLoaded) return null;

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);

  const handleProductClick = (productId) => {
    router.push(`/customer/product/${productId}`);
  };

  const handleCategoryChange = (category) => {
    setCurrentPage(1);
    setCategoryFilter(category);

    if (typeof window !== "undefined") {
      const nextURL = category
        ? `/customer/products?category=${encodeURIComponent(category)}`
        : "/customer/products";
      window.history.replaceState({}, "", nextURL);
    }

    requestAnimationFrame(() => {
      exploreRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const toggleWishlist = async (productId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/SignIn");
      return;
    }

    const isSaved = wishlist.includes(productId);
    const method = isSaved ? "DELETE" : "POST";
    const endpoint = isSaved
      ? `${API_BASE_URL}/api/favourites/${productId}`
      : `${API_BASE_URL}/api/favourites`;

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: isSaved ? undefined : JSON.stringify({ productId }),
      });

      if (response.status === 401) {
        router.push("/SignIn");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to update favourites");
      }

      setWishlist((currentWishlist) =>
        isSaved
          ? currentWishlist.filter((id) => id !== productId)
          : [...currentWishlist, productId]
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={styles.pageShell}>
      <Navbar
        setSearchQuery={setSearchQuery}
        setPriceFilter={setPriceFilter}
        disableFilters={false}
        disableSearch={false}
      />

      <main className={styles.main}>
        <section className={styles.heroSection}>
          <div className={styles.heroPanel}>
            <div className={styles.heroContent}>
              <span className={styles.eyebrow}>Women Premium Edit</span>
              <h1 className={styles.heroTitle}>
                Style That Speaks Your Confidence.
              </h1>
              <p className={styles.heroText}>
                Soft femininity, editorial product storytelling, and modern shopping
                flow come together here without changing any of your existing backend behavior.
              </p>
              <div className={styles.heroActions}>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={() =>
                    exploreRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                >
                  Explore Now
                  <ArrowRight size={18} />
                </button>
              </div>
              {/* <div className={styles.highlightGrid}>
                {serviceHighlights.map((item) => {
                  const Icon = item.icon;
                  return (  
                    <div key={item.label} className={styles.highlightCard}>
                      <div className={styles.highlightIcon}>
                        <Icon size={20} />
                      </div>
                      <p className={styles.highlightValue}>{item.value}</p>
                      <p className={styles.highlightLabel}>{item.label}</p>
                    </div>
                  );
                })}
              </div> */}
            </div>
            <img
              src="/Boutique_image.png"
              alt="Women fashion collection showcase"
              className={styles.sideImage}
            />
          </div>
        </section>

        <section id="categories" className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.eyebrow}>Curated Categories</span>
              <h2 className={styles.sectionTitle}>Explore by mood, moment, and personal style.</h2>
            </div>
            <button type="button" className={styles.linkButton} onClick={() => handleCategoryChange("")}>
              View all
            </button>
          </div>

          <div className={styles.categoryGrid}>
            {curatedCategories.map((category) => (
              <button
                key={category.name}
                type="button"
                className={`${styles.categoryCard} ${categoryFilter === category.name ? styles.categoryActive : ""
                  }`}
                onClick={() => handleCategoryChange(category.name)}
              >
                <span className={styles.categoryTextWrap}>
                  <span className={styles.categoryTitle}>{category.name}</span>
                  <span className={styles.categoryMeta}>{category.label}</span>
                </span>
                <span className={styles.categoryArrow}>View</span>
              </button>
            ))}
          </div>
        </section>

        <section id="explore" ref={exploreRef} className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.eyebrow}>Featured Products</span>
              <h2 className={styles.sectionTitle}>Premium picks for everyday indulgence.</h2>
              <p className={styles.sectionText}>
                Live product data is still powering this grid. The redesign focuses on
                presentation, hierarchy, and emotion.
              </p>
            </div>
            {/* <div className={styles.metricsCard}>
              <p className={styles.metricsLabel}>Showing</p>
              <p className={styles.metricsValue}>{filteredProducts.length}</p>
              <p className={styles.metricsText}>products matching your current edit</p>
            </div> */}
          </div>

          {loading && <div className={styles.messageCard}>Loading premium products...</div>}
          {error && <div className={`${styles.messageCard} ${styles.errorCard}`}>{error}</div>}

          {!loading && !error && (
            <>
              <div className={styles.productGrid}>
                {displayedProducts.length > 0 ? (
                  displayedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onClick={handleProductClick}
                      onToggleWishlist={toggleWishlist}
                      isWishlisted={wishlist.includes(product.id)}
                    />
                  ))
                ) : (
                  <div className={styles.messageCard}>No products found for this selection.</div>
                )}
              </div>

              {displayedProducts.length > 0 && totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    type="button"
                    className={styles.pageButton}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                  >
                    Previous
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                    const startPage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                    const page = startPage + index;
                    if (page > totalPages) return null;

                    return (
                      <button
                        key={page}
                        type="button"
                        className={`${styles.pageButton} ${page === currentPage ? styles.pageCurrent : ""}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    className={styles.pageButton}
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <span className={styles.eyebrow}>Testimonials</span>
              <h2 className={styles.sectionTitle}>Loved for the calm, polished shopping experience.</h2>
            </div>
          </div>

          <div className={styles.testimonialGrid}>
            {testimonials.map((testimonial) => (
              <article key={testimonial.name} className={styles.testimonialCard}>
                <div className={styles.testimonialStars}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={16} fill="currentColor" />
                  ))}
                </div>
                <p className={styles.testimonialQuote}>
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <p className={styles.testimonialName}>{testimonial.name}</p>
                <p className={styles.testimonialRole}>{testimonial.role}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div>
            <p className={styles.footerLabel}>Phalls Customer Page</p>
            <h2 className={styles.footerTitle}>
              Premium discovery, designed for women who shop with intention.
            </h2>
            <p className={styles.footerText}>
              Elegant layouts, refined color balance, softer interactions, and responsive browsing
              make this storefront feel elevated on both desktop and mobile.
            </p>
          </div>

          <div className={styles.footerLinks}>
            <div>
              <p className={styles.footerHeading}>Navigate</p>
              <div className={styles.footerList}>
                <a href="/customer/products">Home</a>
                <a href="/customer/products#explore">Explore</a>
                <a href="/customer/products#categories">Categories</a>
                <a href="/customer/profile">Profile</a>
              </div>
            </div>
            <div>
              <p className={styles.footerHeading}>Contact</p>
              <div className={styles.footerList}>
                <p>care@mplace.com</p>
                <p>+91 90000 00000</p>
                <p>Mon - Sat, 10:00 AM to 7:00 PM</p>
              </div>
            </div>
          </div>

          <div className={styles.socialRow}>
            <a
              href="https://www.instagram.com/suriya_contexts?igsh=emNmdWVzMjhzOGUz"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialChip}
            >
              Instagram
            </a>

            <span className={styles.socialChip}>Facebook</span>
            <span className={styles.socialChip}>Pinterest</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
