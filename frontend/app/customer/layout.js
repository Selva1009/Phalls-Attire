"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  PersonOutline,
  LockReset,
  LocationOn,
  FavoriteBorder,
  History,
  ReceiptLong,
  ShoppingCartCheckout,
  HomeOutlined,
  KeyboardDoubleArrowLeft,
  KeyboardDoubleArrowRight,
} from "@mui/icons-material";

export default function CustomerLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isVerified, setIsVerified] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const storedCustomer = localStorage.getItem("customerUser");
    const token = localStorage.getItem("token");
    if (!storedCustomer || !token) {
      router.replace("/SignIn");
    } else {
      setIsVerified(true);
    }
  }, []);

  const activeTab = useMemo(() => {
    const tabMap = {
      "/customer/profile": "personal",
      "/customer/password": "password",
      "/customer/addresses": "addresses",
      "/customer/orders": "order-history",
      "/customer/transactions": "transactions",
      "/customer/CustomerProfile": "order-history",
    };
    return tabMap[pathname] || pathname;
  }, [pathname]);

  if (!isVerified) return null;

  const allItems = [
    { id: "home",          label: "Home",             href: "/customer/products",                                           icon: <HomeOutlined sx={{ fontSize: 18 }} /> },
    { id: "personal",      label: "Personal Info",    href: "/customer/profile",      icon: <PersonOutline sx={{ fontSize: 18 }} /> },
    { id: "password",      label: "Change Password",  href: "/customer/password",      icon: <LockReset sx={{ fontSize: 18 }} /> },
    { id: "addresses",     label: "Addresses",        href: "/customer/addresses",     icon: <LocationOn sx={{ fontSize: 18 }} /> },
    { id: "wishlist",      label: "Wishlist",         href: "/customer/favourites",      icon: <FavoriteBorder sx={{ fontSize: 18 }} /> },
    { id: "cart",          label: "My Cart",          href: "/customer/cart",          icon: <ShoppingCartCheckout sx={{ fontSize: 18 }} /> },
    { id: "order-history", label: "Order History",    href: "/customer/orders", icon: <History sx={{ fontSize: 18 }} /> },
    { id: "transactions",  label: "Transactions",     href: "/customer/transactions",  icon: <ReceiptLong sx={{ fontSize: 18 }} /> },
  ];

  const isActive = (item) => {
    const profileTabs = new Set(["personal", "password", "addresses", "order-history", "transactions"]);
    if (profileTabs.has(item.id)) {
      return activeTab === item.id;
    }
    return pathname === item.href;
  };

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
          background: rgba(255,255,255,0.8);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          border: 1px solid rgba(255,195,220,0.38);
          border-radius: 20px;
          padding: 12px 10px 14px;
          box-shadow:
            0 1px 3px rgba(200,60,110,0.04),
            0 10px 30px rgba(200,60,110,0.08),
            inset 0 1px 0 rgba(255,255,255,0.88);
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
          border: 1px solid rgba(220,140,175,0.35);
          background: rgba(255,230,243,0.9);
          color: #bf4f7e;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.18s, box-shadow 0.18s, transform 0.18s;
        }
        .csl-toggle:hover {
          background: #ffd0e8;
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
          color: #7e4b68;
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          position: relative;
          transition: background 0.16s, color 0.16s, box-shadow 0.16s, padding 0.3s;
        }
        .csl-sidebar.collapsed .csl-item {
          padding: 8px 0;
          justify-content: center;
          gap: 0;
        }
        .csl-item:hover {
          background: rgba(255,210,230,0.5);
          color: #ad2f66;
        }
        .csl-item.active {
          background: linear-gradient(110deg, #fce0ee 0%, #fdedf6 100%);
          color: #aa2860;
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
          background: rgba(255,225,240,0.7);
          color: #bf4f7e;
          transition: background 0.16s, width 0.3s, height 0.3s;
        }
        .csl-item:hover .csl-icon      { background: rgba(255,205,228,0.85); }
        .csl-item.active .csl-icon     { background: rgba(240,120,170,0.18); color: #aa2860; }
        .csl-sidebar.collapsed .csl-icon {
          width: 36px; height: 36px;
          border-radius: 11px;
          box-shadow: 0 2px 7px rgba(195,55,105,0.09);
        }
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
          background: #8c2252;
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
          border-right-color: #8c2252;
        }
        .csl-sidebar.collapsed .csl-tip-wrap:hover .csl-tip { display: block; }

        /* content */
        .csl-content {
          margin-left: ${W}px;
          padding: 68px 28px 52px 22px;
          min-height: 100vh;
          transition: margin-left 0.3s cubic-bezier(.4,0,.2,1);
          background: #fdf4f8;
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
          border: 1px solid rgba(220,140,175,0.4);
          background: rgba(255,233,245,0.96);
          color: #bf4f7e;
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
            background: rgba(255,248,252,0.98);
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
                {idx === 1 && <div className="csl-sep" />}
                <div className="csl-tip-wrap">
                  <Link
                    href={item.href}
                    className={`csl-item${isActive(item) ? " active" : ""}`}
                    onClick={() => setMobileSidebarOpen(false)}
                  >
                    <span className="csl-icon">{item.icon}</span>
                    <span className="csl-label">{item.label}</span>
                  </Link>
                  <span className="csl-tip">{item.label}</span>
                </div>
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
