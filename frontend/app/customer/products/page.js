"use client";

import { API_BASE_URL, getProductImageSource } from "@/lib/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Heart, Star, X } from "lucide-react";
import Navbar from "../components/Navbar";
import AuthModal from "../components/AuthModal";
import {
  clearAuthRedirect,
  hasBrowseAccess,
  hasFullCustomerAuth,
  setAuthRedirect,
} from "@/lib/customerSession";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/supportContact";
import styles from "./customer-page.module.css";

const PRODUCTS_PER_PAGE = 25;
const MISSING_IMAGE_DATA_URL = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000"><rect width="800" height="1000" fill="#f7eef2"/><text x="400" y="500" text-anchor="middle" dominant-baseline="middle" fill="#9b6b80" font-family="Arial, sans-serif" font-size="36">Image unavailable</text></svg>'
)}`;

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

const categorySlug = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const categorySlugMap = curatedCategories.reduce((acc, category) => {
  acc[categorySlug(category.name)] = category.name;
  return acc;
}, {});

const resolveCategoryParam = (value) => {
  if (!value) return "";
  const trimmed = String(value).trim();
  const directMatch = curatedCategories.find(
    (category) => normalizeText(category.name) === normalizeText(trimmed)
  );
  if (directMatch) return directMatch.name;
  const slug = categorySlug(trimmed);
  return categorySlugMap[slug] || trimmed;
};

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

// const serviceHighlights = [
//   { label: "Curated drops", value: "48h", icon: Sparkles },
//   { label: "Express dispatch", value: "2 Day", icon: Truck },
//   { label: "Loved by members", value: "4.9/5", icon: Star },
// ];

const formatPrice = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const getPriceDetails = (product) => ({
  mrp: Number(product?.mrp ?? product?.price ?? 0),
  final: Number(product?.final_price ?? product?.price ?? 0),
  discount: Number(product?.discount_value ?? 0),
  discountType: product?.discount_type,
});

const buildImageUrl = (product) => {
  const productImageUrl = getProductImageSource(product);
  if (productImageUrl) {
    return productImageUrl;
  }

  if (/^data:image\//i.test(product?.imageUrl || "")) {
    return product.imageUrl;
  }

  const isFallback =
    typeof product?.id === "string" && product.id.startsWith("fallback-");
  return isFallback
    ? product?.localImage || "/CordSet1 (21).jpeg"
    : MISSING_IMAGE_DATA_URL;
};

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const synonyms = {
  churidar: ["chudi", "chudidhar", "salwar", "set"],
  kurti: ["kurta", "top", "long top"],
  anarkali: ["gown", "party dress"],
  nightwear: ["nighty", "night dress", "sleepwear"],
  dupatta: ["shawl", "scarf"],
};

const synonymEntries = Object.entries(synonyms).map(([key, values]) => ({
  key: normalizeText(key),
  values: values.map((value) => normalizeText(value)),
}));

const colorSynonyms = {
  black: ["black", "jet", "charcoal"],
  white: ["white", "ivory", "cream", "offwhite", "off white"],
  red: ["red", "maroon", "burgundy", "wine"],
  blue: ["blue", "navy", "sky", "teal", "cyan"],
  green: ["green", "olive", "emerald", "mint"],
  yellow: ["yellow", "mustard"],
  orange: ["orange", "peach", "coral"],
  pink: ["pink", "rose", "blush", "fuchsia"],
  purple: ["purple", "lavender", "lilac", "violet"],
  brown: ["brown", "tan", "beige", "khaki", "camel"],
  grey: ["grey", "gray", "silver"],
};

const colorEntries = Object.entries(colorSynonyms).map(([key, values]) => ({
  key: normalizeText(key),
  values: values.map((value) => normalizeText(value)),
}));

const resolveSynonym = (term) => {
  const normalized = normalizeText(term);
  if (!normalized) return "";
  for (const entry of synonymEntries) {
    if (normalized === entry.key) return entry.key;
    if (entry.values.includes(normalized)) return entry.key;
  }
  return normalized;
};

const resolveColor = (term) => {
  const normalized = normalizeText(term);
  if (!normalized) return "";
  for (const entry of colorEntries) {
    if (normalized === entry.key) return entry.key;
    if (entry.values.includes(normalized)) return entry.key;
  }
  return "";
};

const getWordSet = (value) =>
  new Set(
    normalizeText(value)
      .split(" ")
      .map((token) => token.trim())
      .filter(Boolean)
  );

const levenshtein = (a, b) => {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;
  const aLen = a.length;
  const bLen = b.length;
  const dp = Array.from({ length: aLen + 1 }, () => new Array(bLen + 1).fill(0));
  for (let i = 0; i <= aLen; i += 1) dp[i][0] = i;
  for (let j = 0; j <= bLen; j += 1) dp[0][j] = j;
  for (let i = 1; i <= aLen; i += 1) {
    for (let j = 1; j <= bLen; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[aLen][bLen];
};

const isFuzzyMatch = (source, target) => {
  if (!source || !target) return false;
  if (source.includes(target) || target.includes(source)) return true;
  const distance = levenshtein(source, target);
  const threshold = target.length <= 4 ? 1 : target.length <= 7 ? 2 : 3;
  return distance <= threshold;
};

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
    product.productName,
    product.category,
    product.description,
  ].join(" "));

const getSearchTokens = (query) =>
  normalizeText(query)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);

const getClosestCategory = (query) => {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return "";
  let bestCategory = "";
  let bestScore = 0;

  Object.entries(categoryKeywords).forEach(([category, keywords]) => {
    const normalizedCategory = normalizeText(category);
    const keywordList = [normalizedCategory, ...keywords.map(normalizeText)];
    let score = 0;
    keywordList.forEach((keyword) => {
      if (!keyword) return;
      if (keyword.includes(normalizedQuery) || normalizedQuery.includes(keyword)) {
        score = Math.max(score, 4);
      } else if (isFuzzyMatch(keyword, normalizedQuery)) {
        score = Math.max(score, 3);
      }
    });
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  });

  return bestCategory;
};

const scoreProduct = (product, queryTokens) => {
  const name = normalizeText(product.productName);
  const category = normalizeText(product.category);
  const description = normalizeText(product.description);
  const scoreBoosts = [];

  let score = 0;

  queryTokens.forEach((token) => {
    if (!token) return;
    if (name === token) score = Math.max(score, 300);
    if (name.includes(token)) score = Math.max(score, 220);
    if (category.includes(token)) score = Math.max(score, 170);
    if (description.includes(token)) score = Math.max(score, 120);

    if (isFuzzyMatch(name, token)) scoreBoosts.push(90);
    if (isFuzzyMatch(category, token)) scoreBoosts.push(70);
    if (isFuzzyMatch(description, token)) scoreBoosts.push(50);
  });

  if (scoreBoosts.length) {
    score = Math.max(score, Math.max(...scoreBoosts));
  }

  return score;
};

const applySearch = (products, query) => {
  const baseQuery = normalizeText(query);
  if (!baseQuery) {
    return products;
  }

  const baseTokens = getSearchTokens(baseQuery);
  const colorTokens = baseTokens.map(resolveColor).filter(Boolean);
  const queryTokens = baseTokens.filter((token) => !resolveColor(token));
  const synonymTokens = baseTokens.map(resolveSynonym);
  const expandedTokens = Array.from(new Set([...queryTokens, ...synonymTokens]));

  const applyColorFilter = (items) => {
    if (!colorTokens.length) return items;
    const uniqueColors = Array.from(new Set(colorTokens));
    return items.filter((product) => {
      const words = getWordSet(
        [product.productName, product.category, product.description].join(" ")
      );
      return uniqueColors.some((color) => words.has(color));
    });
  };

  const searchWithTokens = (items, tokens) => {
    const scored = items
      .map((product) => ({
        product,
        score: scoreProduct(product, tokens),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.product);
    return scored;
  };

  let pool = applyColorFilter(products);
  if (colorTokens.length && !pool.length) {
    return [];
  }

  if (!queryTokens.length) {
    return pool;
  }

  let results = searchWithTokens(pool, queryTokens);
  if (!results.length) {
    results = searchWithTokens(pool, expandedTokens);
  }

  if (!results.length) {
    const closestCategory = getClosestCategory(baseQuery);
    if (closestCategory) {
      results = applyColorFilter(
        products.filter((product) => matchesCategory(product, closestCategory))
      );
    }
  }

  return results.length ? results : pool;
};

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

function ProductCard({
  product,
  onClick,
  onToggleWishlist,
  isWishlisted,
  onQuickView,
  canHover,
}) {
  const handleHoverStart = () => {
    return;
  };

  const handleHoverEnd = () => {};
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
      <div
        className={styles.productMedia}
        onClick={() => {
          handleHoverEnd();
          onClick(product.id);
        }}
        onMouseEnter={handleHoverStart}
        onMouseLeave={handleHoverEnd}
      >
        <img
          src={buildImageUrl(product)}
          alt={product.productName}
          className={styles.productImage}
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = MISSING_IMAGE_DATA_URL;
          }}
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
            {(() => { const prices = getPriceDetails(product); return <div className={styles.productPriceBlock}>
              <p className={styles.productPrice}>{formatPrice(prices.final)}</p>
              {prices.mrp > prices.final && <p className={styles.productMrp}><s>{formatPrice(prices.mrp)}</s><span>{prices.discountType === "percentage" ? `${prices.discount}% off` : `${formatPrice(prices.discount)} off`}</span></p>}
            </div>; })()}
          </div>
          <div className={styles.productActionStack}>
            <button type="button" className={styles.productAction} onClick={() => onClick(product.id)}>
              View
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [wishlist, setWishlist] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const [wishlistLoaded, setWishlistLoaded] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState("login");
  const [pendingRoute, setPendingRoute] = useState("");
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [quickViewSource, setQuickViewSource] = useState("hover");
  const [canHover, setCanHover] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const exploreRef = useRef(null);
  const categoriesRef = useRef(null);
  const scrollToAnchor = useCallback((hash) => {
    if (typeof window === "undefined") return;
    if (!hash) return;
    const targetId = hash.replace("#", "");
    if (!targetId) return;
    const el =
      targetId === "categories"
        ? categoriesRef.current || document.getElementById(targetId)
        : document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleCategoryNav = (event) => {
      const detail = event.detail || {};
      const category = detail.category || "";
      const hash = detail.hash || (category ? "explore" : "categories");
      setCategoryFilter(category);
      setCurrentPage(1);
      const nextUrl = category
        ? `/Home?category=${categorySlug(category)}#${hash}`
        : `/Home#${hash}`;
      window.history.replaceState({}, "", nextUrl);
      requestAnimationFrame(() => scrollToAnchor(`#${hash}`));
    };

    window.addEventListener("category-nav", handleCategoryNav);
    return () => window.removeEventListener("category-nav", handleCategoryNav);
  }, [scrollToAnchor]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isMounted || !wishlistLoaded) return;
    const handleHashScroll = () => {
      scrollToAnchor(window.location.hash);
    };

    requestAnimationFrame(() => handleHashScroll());

    window.addEventListener("hashchange", handleHashScroll);
    return () => window.removeEventListener("hashchange", handleHashScroll);
  }, [isMounted, wishlistLoaded]);

  useEffect(() => {
    if (pathname === "/customer/products") {
      router.replace("/Home");
    }
  }, [pathname, router]);

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
        setWishlist([]);
      } finally {
        setWishlistLoaded(true);
      }
    };

    fetchWishlist();
  }, []);

  useEffect(() => {
    const categoryFromURL = resolveCategoryParam(searchParams.get("category") || "");
    setCategoryFilter(categoryFromURL);
    setCurrentPage(1);
    if (categoryFromURL) {
      requestAnimationFrame(() => {
        exploreRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [searchParams]);

  useEffect(() => {
    if (!searchQuery.trim()) return;

    setCurrentPage(1);

    if (categoryFilter) {
      setCategoryFilter("");
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", "/Home");
      }
    }

    requestAnimationFrame(() => {
      exploreRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [searchQuery]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isMounted || !wishlistLoaded) return;
    if (window.location.hash === "#categories") {
      requestAnimationFrame(() => scrollToAnchor("#categories"));
    }
  }, [searchParams, isMounted, wishlistLoaded]);

  useEffect(() => {
    if (!isMounted) return;
    window.dispatchEvent(new Event("wishlistUpdated"));
  }, [wishlist, isMounted]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const updateHover = () => setCanHover(mediaQuery.matches);
    updateHover();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateHover);
      return () => mediaQuery.removeEventListener("change", updateHover);
    }
    mediaQuery.addListener(updateHover);
    return () => mediaQuery.removeListener(updateHover);
  }, []);

  const closeQuickView = () => {
    setQuickViewOpen(false);
    setQuickViewSource("hover");
  };

  useEffect(() => {
    if (!quickViewOpen) return;
    const handleKey = (event) => {
      if (event.key === "Escape") {
        closeQuickView();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [quickViewOpen]);

  useEffect(() => {
    let isActive = true;

    const fetchProducts = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/auth/products/customer-products`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              page: currentPage,
              limit: PRODUCTS_PER_PAGE,
              search: debouncedSearchQuery.trim(),
              category: categoryFilter,
              sort: priceFilter,
            }),
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        if (!isActive) return;

        if (!data || !Array.isArray(data.products)) {
          throw new Error("Invalid API response format");
        }

        setProducts(data.products);
        setTotalPages(Number(data.pagination?.totalPages || 0));
        if (data.pagination?.page && data.pagination.page !== currentPage) {
          setCurrentPage(data.pagination.page);
        }
      } catch (fetchError) {
        if (!isActive) return;
        setProducts([]);
        setTotalPages(0);
        setError("Unable to load products right now.");
      } finally {
        if (isActive) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      isActive = false;
    };
  }, [categoryFilter, currentPage, debouncedSearchQuery, priceFilter]);

  if (!isMounted || !wishlistLoaded) return null;

  const openAuthModal = (mode = "login", route = "") => {
    setAuthTab(mode);
    setAuthOpen(true);
    if (route) {
      setPendingRoute(route);
      setAuthRedirect(route);
    } else {
      setPendingRoute("");
      clearAuthRedirect();
    }
  };

  const handleLoginSuccess = (data) => {
    setAuthOpen(false);
    clearAuthRedirect();
    if (data.userType === "SUPER_ADMIN") {
      router.push("/vendorUser/addproducts");
      return;
    }
    const nextRoute = pendingRoute || "/Home";
    setPendingRoute("");
    router.push(nextRoute);
  };

  const handleSignupSuccess = () => {
    setAuthOpen(false);
    setPendingRoute("");
    clearAuthRedirect();
    router.push("/Home");
  };

  const handleProductClick = (productId) => {
    const targetRoute = `/customer/product/${productId}`;
    if (!hasBrowseAccess()) {
      openAuthModal("signup", targetRoute);
      return;
    }
    router.push(targetRoute);
  };

  const handleCategoryChange = (category) => {
    setCurrentPage(1);
    setCategoryFilter(category);

    if (typeof window !== "undefined") {
      const nextURL = category
        ? `/Home?category=${categorySlug(category)}`
        : "/Home";
      window.history.replaceState({}, "", nextURL);
    }

    requestAnimationFrame(() => {
      exploreRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const toggleWishlist = async (productId) => {
    if (!hasFullCustomerAuth()) {
      openAuthModal("signup");
      return;
    }

    const token = localStorage.getItem("token");

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
        router.push("/Home");
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

  const openQuickView = (product, source = "hover") => {
    setQuickViewProduct(product);
    setQuickViewSource(source);
    setQuickViewOpen(true);
  };

  return (
    <div className={styles.pageShell}>
      <Navbar
        setSearchQuery={setSearchQuery}
        setPriceFilter={setPriceFilter}
        disableFilters={false}
        disableSearch={false}
        onAuthTrigger={(mode) => openAuthModal(mode)}
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
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => router.push("/About")}
                >
                  About
                </button>
              </div>
            </div>
            <img
              src="/Boutique_image.png"
              alt="Women fashion collection showcase"
              className={styles.sideImage}
            />
          </div>
        </section>

        <section id="categories" ref={categoriesRef} className={styles.section}>
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
                {products.length > 0 ? (
                  products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onClick={handleProductClick}
                      onToggleWishlist={toggleWishlist}
                      isWishlisted={wishlist.includes(product.id)}
                      onQuickView={openQuickView}
                      canHover={canHover}
                    />
                  ))
                ) : (
                  <div className={styles.messageCard}>No products found for this selection.</div>
                )}
              </div>

              {products.length > 0 && totalPages > 1 && (
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
                <a href="/Home">Home</a>
                <a href="/Home#explore">Explore</a>
                <a href="/Home#categories">Categories</a>
                <a href="/customer/profile">Profile</a>
              </div>
            </div>
            <div>
              <p className={styles.footerHeading}>Contact</p>
              <div className={styles.footerList}>
                <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                <p>{SUPPORT_PHONE}</p>
                <p>Mon - Sat, 10:00 AM to 8:00 PM</p>
              </div>
            </div>
          </div>

          <div className={styles.socialRow}>
            <a
              href="https://www.instagram.com/phalls_attire?utm_source=qr&igsi=MW44cXdweHlsYnFqaA=="
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialChip}
            >
              Instagram
            </a>

            <span className={styles.socialChip}>
              <a href="https://www.facebook.com/share/1LNrTgr1sK/" target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
            </span>
          </div>
        </div>
      </footer>

      <AuthModal
        open={authOpen}
        initialTab={authTab}
        onClose={() => setAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onSignupSuccess={handleSignupSuccess}
      />

      {quickViewOpen && quickViewProduct && (
        <div
          className={styles.quickViewOverlay}
          onClick={closeQuickView}
        >
          <div
            className={styles.quickViewCard}
            onClick={(event) => event.stopPropagation()}
            onMouseLeave={() => {
              if (quickViewSource === "hover") {
                closeQuickView();
              }
            }}
          >
            <button
              type="button"
              className={styles.quickViewClose}
              onClick={closeQuickView}
              aria-label="Close quick view"
            >
              <X size={18} />
            </button>
            <div className={styles.quickViewMedia}>
              <img
                src={buildImageUrl(quickViewProduct)}
                alt={quickViewProduct.productName}
                className={styles.quickViewImage}
              />
            </div>
            <div className={styles.quickViewDetails}>
              <span className={styles.quickViewLabel}>Quick View</span>
              <h3 className={styles.quickViewTitle}>{quickViewProduct.productName}</h3>
              <p className={styles.quickViewBrand}>
                {quickViewProduct.brand || quickViewProduct.seller || "Signature Collection"}
              </p>
              {(() => { const prices = getPriceDetails(quickViewProduct); return <div className={styles.quickViewPriceBlock}><p className={styles.quickViewPrice}>{formatPrice(prices.final)}</p>{prices.mrp > prices.final && <p className={styles.quickViewMrp}><s>{formatPrice(prices.mrp)}</s><span>{prices.discountType === "percentage" ? `${prices.discount}% off` : `${formatPrice(prices.discount)} off`}</span></p>}</div>; })()}
              <p className={styles.quickViewDesc}>
                {quickViewProduct.description || "Premium edit crafted to elevate your everyday wardrobe."}
              </p>
              <div className={styles.quickViewActions}>
                <button
                  type="button"
                  className={styles.quickViewPrimary}
                  onClick={() => handleProductClick(quickViewProduct.id)}
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

