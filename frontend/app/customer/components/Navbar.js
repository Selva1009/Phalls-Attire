"use client";

import { API_BASE_URL } from "@/lib/api";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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

const Navbar = ({
  setSearchQuery,
  setPriceFilter,
  disableFilters,
  disableSearch,
}) => {
  const [search, setSearch] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [priceMenuOpen, setPriceMenuOpen] = useState(false);
  const [selectedPriceLabel, setSelectedPriceLabel] = useState("All Prices");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const priceMenuRef = useRef(null);

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
      setCustomerUser(JSON.parse(localStorage.getItem("customerUser")));
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
      await showLogoutSuccess("You have been signed out successfully.");
      router.push("/SignIn");
    }
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <>
      <nav className="customer-nav customer-nav-desktop">
        <div className="customer-nav-brand-group">
          <Link href="/customer/products">
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
            <p className="customer-nav-brand-label">Phalls</p>
            <p className="customer-nav-brand-subtitle">
              Curated styles for every occasion
            </p>
          </div>
        </div>

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

          <Link href="/customer/favourites" className="customer-nav-icon-button">
            <Heart className="customer-nav-action-icon" size={22} />
            {wishlistCount > 0 && (
              <span className="customer-nav-counter customer-nav-counter-heart">
                {wishlistCount}
              </span>
            )}
          </Link>
          
          <Link href="/customer/cart" className="customer-nav-icon-button">
            <ShoppingCart className="customer-nav-action-icon" size={22} />
            {cartCount > 0 && (
              <span className="customer-nav-counter">{cartCount}</span>
            )}
          </Link>

          <div className="customer-nav-profile" onClick={() => setDropdownOpen(!dropdownOpen)}>
             <User className="customer-nav-action-icon" size={22} />

            
           
            <div className="customer-nav-profile-copy">
              {customerUser && (
                <span>
                  {customerUser.personName}
                  <p>Customer User</p>
                </span>
              )}
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
          <Link href="/customer/favourites" className="customer-nav-icon-button customer-nav-mobile-icon">
            <Heart className="customer-nav-action-icon" size={18} />
            {wishlistCount > 0 && (
              <span className="customer-nav-counter customer-nav-counter-heart">
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link href="/customer/cart" className="customer-nav-icon-button customer-nav-mobile-icon">
            <ShoppingCart className="customer-nav-action-icon" size={18} />
            {cartCount > 0 && (
              <span className="customer-nav-counter">{cartCount}</span>
            )}
          </Link>

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

            <div className="customer-nav-mobile-links">
              {/* <div className="customer-nav-mobile-banner">
                <Sparkles size={18} className="customer-nav-logout-icon" />
                <span>Curated shopping flow</span>
              </div> */}

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
            </div>

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
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
