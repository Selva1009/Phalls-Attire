"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  FavoriteBorder,
  History,
  ReceiptLong,
  ShoppingCartCheckout,
  HomeOutlined,
  SettingsOutlined,
  KeyboardDoubleArrowLeft,
  KeyboardDoubleArrowRight,
} from "@mui/icons-material";
import { hasFullCustomerAuth } from "@/lib/customerSession";

function CustomerLayoutInner({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isVerified, setIsVerified] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const THEME_KEY = "customerTheme";
  const isPublicRoute =
    pathname === "/customer/products" ||
    pathname?.startsWith("/customer/product/") ||
    pathname === "/Home";

  useEffect(() => {
    const isAuthed = hasFullCustomerAuth();
    if (!isAuthed && !isPublicRoute) {
      router.replace("/Home");
      return;
    }
    setIsVerified(true);
  }, [isPublicRoute, router]);

  useEffect(() => {
    const applyTheme = (mode) => {
      if (typeof document === "undefined") return;
      const root = document.documentElement;
      root.classList.remove("theme-light", "theme-dark");
      root.classList.add(mode === "dark" ? "theme-dark" : "theme-light");
    };

    const stored = localStorage.getItem(THEME_KEY) || "light";
    applyTheme(stored);

    const handleThemeEvent = () => {
      const fresh = localStorage.getItem(THEME_KEY) || "light";
      applyTheme(fresh);
    };

    window.addEventListener("storage", handleThemeEvent);
    window.addEventListener("theme-change", handleThemeEvent);
    return () => {
      window.removeEventListener("storage", handleThemeEvent);
      window.removeEventListener("theme-change", handleThemeEvent);
    };
  }, []);

  const activeTab = useMemo(() => {
    const tabMap = {
      "/customer/profile": "settings",
      "/customer/password": "settings",
      "/customer/addresses": "settings",
      "/customer/orders": "order-history",
      "/customer/transactions": "transactions",
      "/customer/CustomerProfile": "settings",
      "/customer/settings": "settings",
    };
    return tabMap[pathname] || pathname;
  }, [pathname]);

  const allItems = [
    { id: "home",          label: "Home",             href: "/Home",                                           icon: <HomeOutlined sx={{ fontSize: 18 }} /> },
    { id: "wishlist",      label: "Wishlist",         href: "/customer/favourites",      icon: <FavoriteBorder sx={{ fontSize: 18 }} /> },
    { id: "cart",          label: "My Cart",          href: "/customer/cart",          icon: <ShoppingCartCheckout sx={{ fontSize: 18 }} /> },
    { id: "order-history", label: "Order History",    href: "/customer/orders", icon: <History sx={{ fontSize: 18 }} /> },
    { id: "transactions",  label: "Transactions",     href: "/customer/transactions",  icon: <ReceiptLong sx={{ fontSize: 18 }} /> },
    { id: "settings",      label: "Settings",         href: "/customer/CustomerProfile",    icon: <SettingsOutlined sx={{ fontSize: 18 }} /> },
  ];

  const settingsSubItems = [
    { id: "account", label: "Account", href: "/customer/CustomerProfile?section=account" },
    { id: "addresses", label: "Addresses", href: "/customer/CustomerProfile?section=addresses" },
    { id: "security", label: "Security", href: "/customer/CustomerProfile?section=security" },
    { id: "preferences", label: "Preferences", href: "/customer/CustomerProfile?section=preferences" },
    { id: "support", label: "Support", href: "/customer/CustomerProfile?section=support" },
    { id: "actions", label: "Actions", href: "/customer/CustomerProfile?section=actions" },
  ];

  const showSettingsSubnav = settingsOpen;
  const sectionParam = searchParams.get("section");
  const activeSettingsSection = settingsSubItems.some((item) => item.id === sectionParam)
    ? sectionParam
    : "account";

  const isActive = (item) => {
    const profileTabs = new Set(["settings", "order-history", "transactions"]);
    if (profileTabs.has(item.id)) {
      return activeTab === item.id;
    }
    return pathname === item.href;
  };

  useEffect(() => {
    if (activeTab === "settings") {
      setSettingsOpen(true);
    } else {
      setSettingsOpen(false);
    }
  }, [activeTab]);

  const handleSettingsClick = (event) => {
    if (activeTab === "settings") {
      event.preventDefault();
      setSettingsOpen((prev) => !prev);
      return;
    }
    setSettingsOpen(true);
  };

  if (!isVerified) return null;

  const W  = 252;
  const WC = 66;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@500;600;700;800&display=swap');

        .csl-sidebar {
          position: fixed;
          top: 88px;
          left: 0;
          width: ${W}px;
          height: calc(100vh - 68px);
          z-index: 30;
          display: flex;
          flex-direction: column;
          padding: 14px 0px 20px;
          transition: width 0.3s cubic-bezier(.4,0,.2,1);
          overflow: hidden;
          font-family: 'Nunito', sans-serif;
        }
        .csl-sidebar.collapsed { width: ${WC}px; }

        .csl-card {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: var(--sidebar-bg);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          border: 1px solid var(--sidebar-border);
          border-radius: 20px;
          padding: 12px 10px 14px;
          box-shadow:
            0 1px 3px rgba(0,0,0,0.06),
            0 10px 30px rgba(200,60,110,0.08),
            inset 0 1px 0 rgba(255,255,255,0.4);
          overflow: hidden;
          position: relative;
        }
        .csl-card::after {
          content: '';
          position: absolute;
          bottom: -24px; right: -24px;
          width: 110px; height: 110px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,140,195,0.14) 0%, transparent 65%);
          pointer-events: none;
        }

        /* toggle */
        .csl-toggle {
          align-self: flex-end;
          margin-bottom: 8px;
          flex-shrink: 0;
          width: 26px; height: 26px;
          border-radius: 8px;
          border: 1px solid var(--sidebar-border);
          background: var(--sidebar-pill);
          color: var(--sidebar-text);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.18s, box-shadow 0.18s, transform 0.18s;
        }
        .csl-toggle:hover {
          background: var(--sidebar-hover);
          box-shadow: 0 4px 12px rgba(200,55,105,0.18);
          transform: scale(1.1);
        }
        .csl-sidebar.collapsed .csl-toggle { align-self: center; }

        /* nav list */
        .csl-nav {
          list-style: none;
          margin: 0; padding: 0;
          display: flex;
          flex-direction: column;
          gap: 1px;
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: none;
        }
        .csl-nav::-webkit-scrollbar { display: none; }

        /* separator */
        .csl-sep {
          height: 1px;
          margin: 6px 4px 7px;
          background: linear-gradient(90deg, transparent, rgba(225,155,190,0.38), transparent);
          flex-shrink: 0;
        }

        /* item */
        .csl-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 8px;
          border-radius: 13px;
          text-decoration: none;
          color: var(--sidebar-text);
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          position: relative;
          transition: background 0.16s, color 0.16s, box-shadow 0.16s, padding 0.3s;
          border: 0;
          background: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
        }
        .csl-sidebar.collapsed .csl-item {
          padding: 8px 0;
          justify-content: center;
          gap: 0;
        }
        .csl-item:hover {
          background: var(--sidebar-hover);
          color: var(--accent-strong);
        }
        .csl-item.active {
          background: var(--sidebar-active);
          color: var(--accent-strong);
          font-weight: 700;
          box-shadow: 0 2px 10px rgba(200,55,105,0.11);
        }
        .csl-sidebar:not(.collapsed) .csl-item.active::before {
          content: '';
          position: absolute;
          left: 0; top: 20%; height: 60%;
          width: 3px;
          border-radius: 0 3px 3px 0;
          background: linear-gradient(180deg, #f472b6, #db2777);
        }

        /* icon */
        .csl-icon {
          flex-shrink: 0;
          width: 32px; height: 32px;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          background: var(--sidebar-icon-bg);
          color: var(--accent-strong);
          transition: background 0.16s, width 0.3s, height 0.3s;
        }
        .csl-item:hover .csl-icon      { background: var(--sidebar-icon-hover); }
        .csl-item.active .csl-icon     { background: var(--sidebar-icon-active); color: var(--accent-strong); }
        .csl-sidebar.collapsed .csl-icon {
          width: 36px; height: 36px;
          border-radius: 11px;
          box-shadow: 0 2px 7px rgba(195,55,105,0.09);
        }

        .csl-subnav {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin: 8px 10px 10px 42px;
          padding: 6px 0 4px;
        }
        .csl-subitem {
          border: 0;
          border-radius: 14px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          color: #8b5971;
          background: rgba(255, 235, 245, 0.85);
          box-shadow: 0 8px 20px rgba(220, 110, 160, 0.12);
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }
        .csl-subitem:hover {
          transform: translateX(2px);
          background: rgba(255, 226, 238, 0.95);
          box-shadow: 0 12px 22px rgba(220, 110, 160, 0.18);
        }
        .csl-subitem.active {
          background: linear-gradient(135deg, #e91e78, #c2185b);
          color: #fff;
          box-shadow: 0 16px 30px rgba(220, 60, 110, 0.28);
        }
        .csl-sidebar.collapsed .csl-subnav { display: none; }
        .csl-sidebar.collapsed .csl-item.active .csl-icon {
          box-shadow: 0 4px 13px rgba(195,55,105,0.22);
        }

        /* label */
        .csl-label {
          overflow: hidden;
          max-width: 160px;
          opacity: 1;
          transition: max-width 0.3s ease, opacity 0.18s ease;
        }
        .csl-sidebar.collapsed .csl-label { max-width: 0; opacity: 0; }

        /* tooltip */
        .csl-tip-wrap { position: relative; }
        .csl-tip {
          pointer-events: none;
          display: none;
          position: absolute;
          left: calc(100% + 10px);
          top: 50%;
          transform: translateY(-50%);
          background: var(--accent-strong);
          color: #fff;
          font-size: 11.5px;
          font-weight: 700;
          padding: 5px 10px;
          border-radius: 8px;
          white-space: nowrap;
          box-shadow: 0 4px 13px rgba(140,34,82,0.25);
          z-index: 999;
          letter-spacing: 0.01em;
        }
        .csl-tip::before {
          content: '';
          position: absolute;
          right: 100%; top: 50%;
          transform: translateY(-50%);
          border: 5px solid transparent;
          border-right-color: var(--accent-strong);
        }
        .csl-sidebar.collapsed .csl-tip-wrap:hover .csl-tip { display: block; }

        /* content */
        .csl-content {
          margin-left: ${W}px;
          padding: 68px 28px 52px 22px;
          min-height: 100vh;
          transition: margin-left 0.3s cubic-bezier(.4,0,.2,1);
          background: var(--content-bg);
        }
        .sidebar-collapsed .csl-content { margin-left: ${WC}px; }


        /* mobile */
        .csl-mobile-bar {
          display: none;
          position: fixed;
          top: 76px; left: 12px;
          z-index: 40;
        }
        .csl-hamburger {
          width: 36px; height: 36px;
          border-radius: 11px;
          border: 1px solid var(--sidebar-border);
          background: var(--sidebar-pill);
          color: var(--sidebar-text);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          font-size: 17px;
          box-shadow: 0 3px 12px rgba(200,55,105,0.13);
        }
        .csl-backdrop {
          display: none;
          position: fixed; inset: 0;
          background: rgba(18,6,12,0.28);
          z-index: 35;
          backdrop-filter: blur(4px);
        }

        @media (max-width: 860px) {
          .csl-content { margin-left: 0 !important; padding-left: 14px; padding-right: 14px; }
          .csl-mobile-bar { display: flex; }
          .csl-backdrop   { display: block; }
          .csl-sidebar {
            width: min(255px, 84%) !important;
            transform: translateX(-110%);
            transition: transform 0.26s cubic-bezier(.4,0,.2,1);
            top: 0; height: 100%;
            padding-top: 78px;
            background: var(--sidebar-bg);
          }
          .csl-sidebar.mobile-open { transform: translateX(0); }
          .csl-toggle { display: none; }
          .csl-sidebar.collapsed .csl-label { max-width: 160px; opacity: 1; }
          .csl-sidebar.collapsed .csl-item  { justify-content: flex-start; padding: 8px 8px; gap: 10px; }
          .csl-sidebar.collapsed .csl-icon  { width: 32px; height: 32px; border-radius: 9px; box-shadow: none; }
        }
      `}</style>

      {/* Mobile trigger */}
      <div className="csl-mobile-bar">
        <button className="csl-hamburger" onClick={() => setMobileSidebarOpen(true)} aria-label="Open menu">☰</button>
      </div>

      {mobileSidebarOpen && (
        <div className="csl-backdrop" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={["csl-sidebar", collapsed ? "collapsed" : "", mobileSidebarOpen ? "mobile-open" : ""].filter(Boolean).join(" ")}>
        <div className="csl-card">

          {/* Toggle */}
          <button className="csl-toggle" onClick={() => setCollapsed(c => !c)} aria-label="toggle sidebar">
            {collapsed
              ? <KeyboardDoubleArrowRight sx={{ fontSize: 14 }} />
              : <KeyboardDoubleArrowLeft  sx={{ fontSize: 14 }} />}
          </button>

          {/* Flat nav — all items, no section labels */}
          <ul className="csl-nav">
            {allItems.map((item, idx) => (
              <li key={item.id}>
                {idx === allItems.length - 1 && <div className="csl-sep" />}
                <div className="csl-tip-wrap">
                  {item.id === "settings" ? (
                    <Link
                      href={`${item.href}?section=${activeSettingsSection}`}
                      className={`csl-item${isActive(item) ? " active" : ""}`}
                      onClick={(event) => {
                        handleSettingsClick(event);
                        setMobileSidebarOpen(false);
                      }}
                    >
                      <span className="csl-icon">{item.icon}</span>
                      <span className="csl-label">{item.label}</span>
                    </Link>
                  ) : (
                    <Link
                      href={item.href}
                      className={`csl-item${isActive(item) ? " active" : ""}`}
                      onClick={() => setMobileSidebarOpen(false)}
                    >
                      <span className="csl-icon">{item.icon}</span>
                      <span className="csl-label">{item.label}</span>
                    </Link>
                  )}
                  <span className="csl-tip">{item.label}</span>
                </div>
                {item.id === "settings" && showSettingsSubnav && (
                  <div className="csl-subnav">
                    {settingsSubItems.map((sub) => (
                      <Link
                        key={sub.id}
                        href={sub.href}
                        className={`csl-subitem${activeSettingsSection === sub.id ? " active" : ""}`}
                        onClick={() => setMobileSidebarOpen(false)}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>

        </div>
      </aside>

      {/* ── Page content ── */}
      <div className={collapsed ? "sidebar-collapsed" : ""}>
        <main className="csl-content">{children}</main>
      </div>
    </>
  );
}

export default function CustomerLayout({ children }) {
  return (
    <Suspense fallback={null}>
      <CustomerLayoutInner>{children}</CustomerLayoutInner>
    </Suspense>
  );
}
