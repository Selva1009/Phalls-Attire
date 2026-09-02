"use client";
import { API_BASE_URL, getProductImageSource } from "@/lib/api";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FaSearch } from "react-icons/fa";
import { Pencil, Trash2 } from "lucide-react";

const formatPrice = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

export default function EcommercePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [vendorUserId, setVendorUserId] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeProductId, setActiveProductId] = useState(null);
  const itemsPerPage = 20;
  const initialPage = Number(searchParams.get("page") || 1);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const imageCacheBuster = useMemo(() => Date.now(), []);
  const restoreRef = useRef(false);
  const scrollKey = "vendorReturnScroll:productcards";

  // ✅ Fixed: Correct key from localStorage
  useEffect(() => {
    const idFromStorage = localStorage.getItem("vendorUserId");
    if (idFromStorage) {
      setVendorUserId(idFromStorage);
    } else {
      setError("Vendor user ID not found in localStorage.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!vendorUserId) return;

    let isMounted = true;
    const fetchProducts = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/auth/products/get-products/${vendorUserId}`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.statusText}`);
        }
        const data = await response.json();
        if (isMounted) {
          setProducts(data.products);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [vendorUserId]);

  useEffect(() => {
    const pageParam = Number(searchParams.get("page") || 1);
    if (!Number.isNaN(pageParam)) {
      setCurrentPage(pageParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (loading || restoreRef.current) return;
    if (typeof window === "undefined") return;
    const saved = sessionStorage.getItem(scrollKey);
    if (!saved) return;
    restoreRef.current = true;
    sessionStorage.removeItem(scrollKey);
    requestAnimationFrame(() => {
      window.scrollTo({ top: Number(saved) || 0, behavior: "auto" });
    });
  }, [loading]);

  const searchRef = useRef(search);

  useEffect(() => {
    if (searchRef.current === search) return;
    searchRef.current = search;
    setCurrentPage(1);
  }, [search]);

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

  const getSearchTokens = (query) =>
    normalizeText(query)
      .split(" ")
      .map((token) => token.trim())
      .filter(Boolean);

  const scoreProduct = (product, queryTokens) => {
    const name = normalizeText(product.productName);
    const category = normalizeText(product.category);
    const description = normalizeText(product.description);
    let score = 0;
    const boosts = [];

    queryTokens.forEach((token) => {
      if (!token) return;
      if (name === token) score = Math.max(score, 300);
      if (name.includes(token)) score = Math.max(score, 220);
      if (category.includes(token)) score = Math.max(score, 170);
      if (description.includes(token)) score = Math.max(score, 120);

      if (isFuzzyMatch(name, token)) boosts.push(90);
      if (isFuzzyMatch(category, token)) boosts.push(70);
      if (isFuzzyMatch(description, token)) boosts.push(50);
    });

    if (boosts.length) {
      score = Math.max(score, Math.max(...boosts));
    }

    return score;
  };

  const applySearch = (items, query) => {
    const baseQuery = normalizeText(query);
    if (!baseQuery) return items;

    const baseTokens = getSearchTokens(baseQuery);
    const colorTokens = baseTokens.map(resolveColor).filter(Boolean);
    const queryTokens = baseTokens.filter((token) => !resolveColor(token));
    const synonymTokens = baseTokens.map(resolveSynonym);
    const expandedTokens = Array.from(new Set([...queryTokens, ...synonymTokens]));

    const applyColorFilter = (pool) => {
      if (!colorTokens.length) return pool;
      const uniqueColors = Array.from(new Set(colorTokens));
      return pool.filter((product) => {
        const words = getWordSet(
          [product.productName, product.category, product.description].join(" ")
        );
        return uniqueColors.some((color) => words.has(color));
      });
    };

    const searchWithTokens = (pool, tokens) =>
      pool
        .map((product) => ({
          product,
          score: scoreProduct(product, tokens),
        }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((entry) => entry.product);

    let pool = applyColorFilter(items);
    if (colorTokens.length && !pool.length) return [];
    if (!queryTokens.length) return pool;

    let results = searchWithTokens(pool, queryTokens);
    if (!results.length) {
      results = searchWithTokens(pool, expandedTokens);
    }

    return results.length ? results : pool;
  };

  const filteredProducts = useMemo(() => {
    return search ? applySearch(products, search) : products;
  }, [products, search]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const selectedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const handleEdit = (productId) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(scrollKey, String(window.scrollY || 0));
    }
    const returnTo = `/vendorUser/productcards?page=${currentPage}`;
    router.push(
      `/vendorUser/updateproduct/${productId}?page=${currentPage}&returnTo=${encodeURIComponent(
        returnTo
      )}`
    );
  };

  const handleDelete = async (productId) => {
    const ok = window.confirm("Delete this product?");
    if (!ok) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/products/delete-product/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete product");
      }
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setActiveProductId((prev) => (prev === productId ? null : prev));
    } catch (err) {
      setError(err.message || "Failed to delete product");
    }
  };

  return (
    <div className="min-h-screen border border-gray-200">
      {/* Navbar */}
      <nav className="bg-white shadow-md py-4 px-6 flex flex-col md:flex-row justify-between items-center border-b border-gray-300">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">Product Spot</h1>
          <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {products.length} products
          </span>
        </div>
        <div className="flex gap-4 items-center mt-2 md:mt-0">
          <div className="relative w-full md:w-[300px]">
            <input
              type="text"
              placeholder="Search products"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FaSearch className="absolute right-3 top-3 text-gray-600" />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-6 bg-gray-50">
        {error && <div className="text-red-500">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {selectedProducts.length > 0
            ? selectedProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-gray-50 rounded-xl shadow-md overflow-hidden p-4 border border-gray-300 transition-all duration-300 transform hover:scale-105 cursor-pointer"
                  onClick={() =>
                    setActiveProductId((prev) => (prev === product.id ? null : product.id))
                  }
                >
                  <div className="relative">
                    {getProductImageSource(product, imageCacheBuster) && (
                      <img
                        src={getProductImageSource(product, imageCacheBuster)}
                        alt={product.productName}
                        className="w-full h-60 object-cover rounded-lg"
                        onError={(event) => {
                          event.currentTarget.src = "/notfound.jpg";
                        }}
                      />
                    )}
                    {activeProductId === product.id && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-3 rounded-lg">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(product.id);
                          }}
                          className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/95 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-900 shadow-md backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(product.id);
                          }}
                          className="inline-flex items-center gap-2 rounded-full border border-red-500/70 bg-red-600/95 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white shadow-md transition hover:-translate-y-0.5 hover:bg-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 text-left">
                    <h3 className="text-lg text-gray-700 hover:text-blue-700 font-bold truncate">
                      {product.productName}
                    </h3>
                    <p className="text-md text-gray-600">{product.brand}</p>
                    <p className="text-xl font-bold text-black mt-2">
                      {formatPrice(product.final_price ?? product.price)}
                    </p>
                  </div>
                </div>
              ))
            : !loading && (
                <p className="text-gray-600 text-center col-span-full">
                  No products available.
                </p>
              )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-wrap justify-center items-center mt-6 space-x-2">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="bg-blue-500 text-white hover:bg-blue-700 px-4 py-2"
            >
              Previous
            </Button>

            {(() => {
              const rangeSize = 5;
              const halfRange = Math.floor(rangeSize / 2);
              let startPage = Math.max(1, currentPage - halfRange);
              let endPage = Math.min(totalPages, startPage + rangeSize - 1);

              if (endPage - startPage + 1 < rangeSize) {
                startPage = Math.max(1, endPage - rangeSize + 1);
              }

              return Array.from(
                { length: endPage - startPage + 1 },
                (_, index) => startPage + index
              ).map((page) => (
                <Button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 ${
                    page === currentPage
                      ? "bg-blue-500 text-white hover:bg-blue-700"
                      : "bg-white text-black hover:bg-blue-700 hover:text-white border border-gray-300"
                  }`}
                >
                  {page}
                </Button>
              ));
            })()}

            <Button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="bg-blue-500 text-white hover:bg-blue-700 px-4 py-2"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
