"use client";

import { API_BASE_URL } from "@/lib/api";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  Heart,
  User,
  LogOut,
  Calendar,
  Package,
  Menu,
  X,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";
import { showLogoutSuccess } from "@/lib/authAlerts";
import { clearSignupSession, hasFullCustomerAuth } from "@/lib/customerSession";

const Navbar = ({
  setSearchQuery,
  setPriceFilter,
  disableFilters,
  disableSearch,
  variant = "default",
  onAuthTrigger,
  hideCategories = false,
}) => {
  const [search, setSearch] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [priceMenuOpen, setPriceMenuOpen] = useState(false);
  const [selectedPriceLabel, setSelectedPriceLabel] = useState("All Prices");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [categoryMenuPinned, setCategoryMenuPinned] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const priceMenuRef = useRef(null);
  const categoryMenuRef = useRef(null);
  const isHomeVariant = variant === "home";
  const isOnHome =
    (pathname || "").replace(/\/+$/, "") === "/Home";
  const navLinks = [
    { label: "Home", href: "/Home" },
    { label: "Categories", href: "/Home#categories" },
    { label: "New Arrivals", href: "/Home#highlights" },
    { label: "Best Sellers", href: "/Home#explore" },
  ];
  const visibleNavLinks = hideCategories
    ? navLinks.filter((link) => link.label !== "Categories")
    : navLinks;

  const categorySlug = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const categoryItems = [
    "Women's Tops",
    "Exquisite Churidar Suits",
    "Premium Co-Ord Sets",
    "Designer Gowns",
    "Kurta Pant Dupatta Sets",
    "Nightwear Trio Sets",
    "Pure Cotton Nightwear",
    "Designer Sarees",
    "Signature Leggings",
  ];

  const [customerUser, setCustomerUser] = useState(() => {
    if (typeof window === "undefined") return null;
    return JSON.parse(localStorage.getItem("customerUser")) || null;
  });

  const fetchCartCount = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.ok) {
        setCartCount(0);
        return;
      }
      const data = await response.json();
      setCartCount(data.cartItems?.length || 0);
    } catch {
      setCartCount(0);
    }
  };

  const syncWishlistCount = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setWishlistCount(0);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/favourites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        setWishlistCount(0);
        return;
      }
      const data = await response.json();
      setWishlistCount(Array.isArray(data.favourites) ? data.favourites.length : 0);
    } catch (error) {
      setWishlistCount(0);
    }
  };

  useEffect(() => {
    const updateCustomerUser = () => {
      const stored = JSON.parse(localStorage.getItem("customerUser"));
      setCustomerUser(stored);
      if (stored?.id) {
        fetchCartCount(stored.id);
      }
      syncWishlistCount();
    };

    const handleWishlistChange = () => {
      syncWishlistCount();
    };

    window.addEventListener("storage", updateCustomerUser);
    window.addEventListener("wishlistUpdated", handleWishlistChange);

    return () => {
      window.removeEventListener("storage", updateCustomerUser);
      window.removeEventListener("wishlistUpdated", handleWishlistChange);
    };
  }, []);

  useEffect(() => {
    const storedCustomerUser = localStorage.getItem("customerUser");
    if (storedCustomerUser) {
      const userData = JSON.parse(storedCustomerUser);
      setCustomerUser(userData);
      fetchCartCount(userData.id);
    }
    syncWishlistCount();
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      if (customerUser) fetchCartCount(customerUser.id);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [customerUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (priceMenuRef.current && !priceMenuRef.current.contains(event.target)) {
        setPriceMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target)) {
        setCategoryMenuOpen(false);
        setCategoryMenuPinned(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const triggerAuth = (mode = "login") => {
    if (onAuthTrigger) {
      onAuthTrigger(mode);
      return;
    }
    router.push(mode === "signup" ? "/customer-signup" : "/Home");
  };

  const handleProtectedNav = (path) => {
    if (!hasFullCustomerAuth()) {
      triggerAuth("login");
      return;
    }
    router.push(path);
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Sign out?",
      text: "You can sign in again anytime.",
      // imageUrl:
        // "https://images.pexels.com/photos/776620/pexels-photo-776620.jpeg?auto=compress&cs=tinysrgb&w=200",
      // imageWidth: 84,
      // imageHeight: 84,
      imageAlt: "Heart icon",
      showCancelButton: true,
      confirmButtonColor: "#E91E63",
      cancelButtonColor: "#AD1457",
      confirmButtonText: "Logout",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "swal-soft-popup",
        title: "swal-soft-title",
        htmlContainer: "swal-soft-text",
        confirmButton: "swal-soft-confirm",
        cancelButton: "swal-soft-cancel",
      },
    });

    if (result.isConfirmed) {
      localStorage.clear();
      setCustomerUser(null);
      setCartCount(0);
      setWishlistCount(0);
      setDropdownOpen(false);
      clearSignupSession();
      await showLogoutSuccess("You have been signed out successfully.");
      router.push("/Home");
    }
  };

  const dispatchHomeScroll = (hash, category = "") => {
    if (typeof window === "undefined") return;
    if (!hash) {
      window.history.replaceState({}, "", "/Home");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    window.dispatchEvent(
      new CustomEvent("category-nav", { detail: { category, hash } })
    );
  };

  const handleCategoryNavigate = (href, category = "") => {
    setCategoryMenuOpen(false);
    setCategoryMenuPinned(false);
    const hash = href.includes("#categories")
      ? "categories"
      : href.includes("#explore")
        ? "explore"
        : "";
    if (isOnHome) {
      dispatchHomeScroll(hash, category);
      return;
    }
    router.push(href, { scroll: false });
  };

  const handleNavLink = (href) => {
    const hash = href.includes("#categories")
      ? "categories"
      : href.includes("#explore")
        ? "explore"
        : "";
    if (isOnHome) {
      dispatchHomeScroll(hash, "");
      return;
    }
    router.push(href, { scroll: false });
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <>
      <nav className={`customer-nav customer-nav-desktop ${isHomeVariant ? "customer-nav-home" : ""}`}>
        <div className="customer-nav-brand-group">
          <Link href="/Home">
            <div className="customer-nav-logo-shell">
              <div className="customer-nav-logo-core">
                <img
                  src="/Logo.png"
                  alt="M-Place Logo"
                  className="customer-nav-logo-image"
                />
              </div>
            </div>
          </Link>

          <div className="customer-nav-brand-copy">
            <p className="customer-nav-brand-label">Phalls Attire</p>
            <p className="customer-nav-brand-subtitle">
              Curated styles for every occasion
            </p>
          </div>

          {isHomeVariant && (
            <div className="customer-nav-links">
              {visibleNavLinks.map((link) =>
                link.label === "Categories" ? (
                  <div
                    key={link.label}
                    className="customer-nav-category"
                    ref={categoryMenuRef}
                  >
                    <button
                      type="button"
                      className="customer-nav-link-button"
                      onClick={() => {
                        setCategoryMenuPinned((prev) => {
                          const nextPinned = !prev;
                          setCategoryMenuOpen(nextPinned);
                          return nextPinned;
                        });
                      }}
                      aria-haspopup="true"
                      aria-expanded={categoryMenuOpen}
                    >
                      Categories
                    </button>
                    <div className={`customer-nav-category-menu ${categoryMenuOpen ? "open" : ""}`}>
                      <button
                        type="button"
                        className="customer-nav-category-item customer-nav-category-all"
                        onClick={() => handleCategoryNavigate("/Home#categories", "")}
                      >
                        View all
                      </button>
                      {categoryItems.map((item) => (
                        <button
                          type="button"
                          key={item}
                          className="customer-nav-category-item"
                          onClick={() =>
                            handleCategoryNavigate(
                              `/Home?category=${categorySlug(item)}#explore`,
                              item
                            )
                          }
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button
                    key={link.href}
                    type="button"
                    className="customer-nav-link-button"
                    onClick={() => handleNavLink(link.href)}
                  >
                    {link.label}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {isHomeVariant && (
          <div className="customer-nav-title">PHALLS ATTIRE</div>
        )}

        <div className="customer-nav-center">
          {!disableSearch && (
            <div className="customer-nav-search-shell">
              <Search className="customer-nav-search-icon" size={20} />
              <input
                type="text"
                placeholder="Search for products..."
                className="customer-nav-search-input"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSearchQuery && setSearchQuery(e.target.value);
                }}
              />
            </div>
          )}

          {!isHomeVariant && !hideCategories && (
            <div
              className="customer-nav-category customer-nav-category-center"
              ref={categoryMenuRef}
            >
              <button
                type="button"
                className="customer-nav-category-pill"
                onClick={() => {
                  setCategoryMenuPinned((prev) => {
                    const nextPinned = !prev;
                    setCategoryMenuOpen(nextPinned);
                    return nextPinned;
                  });
                }}
                aria-haspopup="true"
                aria-expanded={categoryMenuOpen}
              >
                Categories
                <ChevronDown size={14} />
              </button>
              <div className={`customer-nav-category-menu ${categoryMenuOpen ? "open" : ""}`}>
                <button
                  type="button"
                  className="customer-nav-category-item customer-nav-category-all"
                  onClick={() => handleCategoryNavigate("/Home#categories", "")}
                >
                  View all
                </button>
                {categoryItems.map((item) => (
                  <button
                    type="button"
                    key={item}
                    className="customer-nav-category-item"
                    onClick={() =>
                      handleCategoryNavigate(
                        `/Home?category=${categorySlug(item)}#explore`,
                        item
                      )
                    }
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!disableFilters && (
            <div className="customer-nav-filter-wrap" ref={priceMenuRef}>
              <div className="customer-nav-select-shell">
                <div className="customer-nav-select-icon-wrap">
                  <SlidersHorizontal size={16} className="customer-nav-select-icon" />
                </div>
                <button
                  type="button"
                  className="customer-nav-select-button"
                  onClick={() => setPriceMenuOpen((current) => !current)}
                  aria-haspopup="listbox"
                  aria-expanded={priceMenuOpen}
                >
                  <span className="customer-nav-select-label">{selectedPriceLabel}</span>
                  <ChevronDown
                    size={16}
                    className={`customer-nav-select-arrow ${priceMenuOpen ? "customer-nav-select-arrow-open" : ""}`}
                  />
                </button>
              </div>

              {priceMenuOpen && (
                <div className="customer-nav-select-menu" role="listbox">
                  {[
                    { label: "All Prices", value: "" },
                    { label: "Low to High", value: "low" },
                    { label: "High to Low", value: "high" },
                  ].map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      className={`customer-nav-select-option ${
                        selectedPriceLabel === option.label ? "customer-nav-select-option-active" : ""
                      }`}
                      onClick={() => {
                        setSelectedPriceLabel(option.label);
                        setPriceFilter && setPriceFilter(option.value);
                        setPriceMenuOpen(false);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="customer-nav-actions">
          <div className="customer-nav-date">
            <Calendar className="customer-nav-action-icon" size={18} />
            <span>{currentDate}</span>
          </div>

          <button
            type="button"
            className="customer-nav-icon-button"
            onClick={() => handleProtectedNav("/customer/favourites")}
          >
            <Heart className="customer-nav-action-icon" size={22} />
            {wishlistCount > 0 && (
              <span className="customer-nav-counter customer-nav-counter-heart">
                {wishlistCount}
              </span>
            )}
          </button>
          
          <button
            type="button"
            className="customer-nav-icon-button"
            onClick={() => handleProtectedNav("/customer/cart")}
          >
            <ShoppingCart className="customer-nav-action-icon" size={22} />
            {cartCount > 0 && (
              <span className="customer-nav-counter">{cartCount}</span>
            )}
          </button>

          {customerUser ? (
            <div className="customer-nav-profile" onClick={() => setDropdownOpen(!dropdownOpen)}>
              <User className="customer-nav-action-icon" size={22} />

              <div className="customer-nav-profile-copy">
                <span>
                  {customerUser.personName}
                  <p>Customer User</p>
                </span>
              </div>

              {dropdownOpen && (
                <div className="customer-nav-dropdown">
                  <ul>
                    <li>
                      <Link
                        href="/customer/profile"
                        className="customer-nav-dropdown-item"
                      >
                        <User size={20} className="customer-nav-action-icon" />
                        <span>My Profile</span>
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/customer/PoAutomation"
                        className="customer-nav-dropdown-item"
                      >
                        <Package size={20} className="customer-nav-action-icon" />
                        <span>My Orders</span>
                      </Link>
                    </li>
                    <li>
                      <button
                        onClick={handleLogout}
                        className="customer-nav-dropdown-item customer-nav-dropdown-logout"
                      >
                        <LogOut size={20} className="customer-nav-logout-icon" />
                        <span>Logout</span>
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="customer-nav-auth">
              <button
                type="button"
                className="customer-nav-auth-button customer-nav-auth-secondary"
                onClick={() => triggerAuth("login")}
              >
                Login
              </button>
              <button
                type="button"
                className="customer-nav-auth-button customer-nav-auth-primary"
                onClick={() => triggerAuth("signup")}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </nav>

      <nav className="customer-nav customer-nav-mobile">
        <div className="customer-nav-mobile-brand">
          <div className="customer-nav-mobile-logo">
            <div className="customer-nav-logo-core customer-nav-mobile-logo-core">
              <img
                src="/Logo.png"
                alt="M-Place Logo"
                className="customer-nav-mobile-logo-image"
              />
            </div>
          </div>

          <div className="customer-nav-mobile-copy">
            <span>Customer</span>
            <p>Premium</p>
          </div>
        </div>

        <div className="customer-nav-mobile-actions">
          <button
            type="button"
            className="customer-nav-icon-button customer-nav-mobile-icon"
            onClick={() => handleProtectedNav("/customer/favourites")}
          >
            <Heart className="customer-nav-action-icon" size={18} />
            {wishlistCount > 0 && (
              <span className="customer-nav-counter customer-nav-counter-heart">
                {wishlistCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className="customer-nav-icon-button customer-nav-mobile-icon"
            onClick={() => handleProtectedNav("/customer/cart")}
          >
            <ShoppingCart className="customer-nav-action-icon" size={18} />
            {cartCount > 0 && (
              <span className="customer-nav-counter">{cartCount}</span>
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="customer-nav-menu-button"
          >
            {mobileMenuOpen ? (
              <X size={22} className="customer-nav-action-icon" />
            ) : (
              <Menu size={22} className="customer-nav-action-icon" />
            )}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div
          className="customer-nav-mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="customer-nav-mobile-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            {customerUser ? (
              <div className="customer-nav-mobile-user">
                <div className="customer-nav-mobile-avatar">
                  <User size={24} className="customer-nav-action-icon" />
                </div>
                <div>
                  <p className="customer-nav-mobile-user-name">
                    {customerUser?.personName || "Customer User"}
                  </p>
                  <p className="customer-nav-mobile-user-role">Customer User</p>
                </div>
              </div>
            ) : (
              <div className="customer-nav-mobile-user customer-nav-mobile-guest">
                <div className="customer-nav-mobile-avatar">
                  <User size={24} className="customer-nav-action-icon" />
                </div>
                <div>
                  <p className="customer-nav-mobile-user-name">Guest</p>
                  <p className="customer-nav-mobile-user-role">Browse premium edits</p>
                </div>
              </div>
            )}

            <div className="customer-nav-mobile-links">
              {isHomeVariant &&
                navLinks.map((link) => (
                  <button
                    key={link.href}
                    type="button"
                    className="customer-nav-mobile-link"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleNavLink(link.href);
                    }}
                  >
                    {link.label}
                  </button>
                ))}

              {customerUser && (
                <>
                  <Link
                    href="/customer/profile"
                    className="customer-nav-mobile-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User size={20} className="customer-nav-action-icon" />
                    <span>My Profile</span>
                  </Link>

                  <Link
                    href="/customer/favourites"
                    className="customer-nav-mobile-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Heart size={20} className="customer-nav-action-icon" />
                    <span>Favourite ({wishlistCount})</span>
                  </Link>

                  <Link
                    href="/customer/cart"
                    className="customer-nav-mobile-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ShoppingCart size={20} className="customer-nav-action-icon" />
                    <span>My Cart ({cartCount})</span>
                  </Link>

                  <Link
                    href="/customer/PoAutomation"
                    className="customer-nav-mobile-link"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Package size={20} className="customer-nav-action-icon" />
                    <span>My Orders</span>
                  </Link>
                </>
              )}

              {!customerUser && (
                <>
                  <button
                    type="button"
                    className="customer-nav-mobile-link"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      triggerAuth("login");
                    }}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    className="customer-nav-mobile-link customer-nav-mobile-cta"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      triggerAuth("signup");
                    }}
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>

            {customerUser && (
              <div className="customer-nav-mobile-footer">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="customer-nav-mobile-link customer-nav-mobile-logout"
                >
                  <LogOut size={20} className="customer-nav-logout-icon" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;

