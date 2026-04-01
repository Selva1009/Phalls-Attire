"use client";

import { API_BASE_URL } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Download,
  Loader2,
  RefreshCw,
  Search,
  ShoppingBag,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import Footer from "@/app/LandingPage/Footer";
import styles from "./orders-page.module.css";

const ACTIVE_STATUSES = ["pending", "processing", "approved", "shipped"];

const statusMap = {
  pending: {
    label: "Order Placed",
    tone: styles.statusPlaced,
    step: 1,
    note: "Seller confirmation is pending.",
  },
  processing: {
    label: "Processing",
    tone: styles.statusProcessing,
    step: 2,
    note: "Your order is being prepared.",
  },
  approved: {
    label: "Confirmed",
    tone: styles.statusProcessing,
    step: 2,
    note: "The seller confirmed your order.",
  },
  shipped: {
    label: "Shipped",
    tone: styles.statusShipped,
    step: 3,
    note: "Your order is on the way.",
  },
  delivered: {
    label: "Delivered",
    tone: styles.statusDelivered,
    step: 4,
    note: "Order delivered successfully.",
  },
  completed: {
    label: "Delivered",
    tone: styles.statusDelivered,
    step: 4,
    note: "Order delivered successfully.",
  },
  cancelled: {
    label: "Cancelled",
    tone: styles.statusCancelled,
    step: 0,
    note: "This order was cancelled.",
  },
};

const timelineSteps = ["Placed", "Processing", "Shipped", "Delivered"];

const normalizeStatus = (status) => String(status || "pending").toLowerCase();

const getStatusMeta = (status) =>
  statusMap[normalizeStatus(status)] || statusMap.pending;

const formatCurrency = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "N/A";

const formatOrderNumber = (value, fallback) => {
  const raw = String(value || fallback || "").trim();
  const cleaned = raw.replace(/^PO[-\s]?/i, "").trim();
  return cleaned || String(fallback || "").trim();
};

const buildSearchText = (order) =>
  [
    order.po_number,
    order.status,
    order.customer_name,
    order.customer_company,
    order.items?.[0]?.product_name,
    order.items?.[0]?.vendor_name,
    order.items?.[0]?.vendor_company,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

function OrderDetailModal({
  order,
  downloading,
  onClose,
  onDownloadInvoice,
  onBuyAgain,
  onNeedHelp,
}) {
  const statusMeta = getStatusMeta(order.status);
  const shipToAddress =
    order.ship_to_address ||
    order.customer_address ||
    "Shipping address not available";

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.modalEyebrow}>Order Details</p>
            <h2 className={styles.modalTitle}>
              Order #{formatOrderNumber(order.po_number, order.id)}
            </h2>
            <p className={styles.modalSubtitle}>Placed on {formatDate(order.order_date)}</p>
          </div>
          <button type="button" className={styles.modalClose} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalStatusRow}>
          <span className={`${styles.statusBadge} ${statusMeta.tone}`}>{statusMeta.label}</span>
          <p className={styles.statusNote}>{statusMeta.note}</p>
        </div>

        <div className={styles.timeline}>
          {timelineSteps.map((step, index) => {
            const stepIndex = index + 1;
            const isComplete = statusMeta.step >= stepIndex && normalizeStatus(order.status) !== "cancelled";
            return (
              <div key={step} className={styles.timelineItem}>
                <div className={`${styles.timelineDot} ${isComplete ? styles.timelineDotActive : ""}`} />
                <span className={`${styles.timelineLabel} ${isComplete ? styles.timelineLabelActive : ""}`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>

        <div className={styles.modalGrid}>
          <section className={styles.modalSection}>
            <h3>Items</h3>
            <div className={styles.itemList}>
              {order.items?.map((item, index) => (
                <article key={`${item.product_id || item.product_name}-${index}`} className={styles.itemCard}>
                  <div>
                    <p className={styles.itemName}>{item.product_name || "Order item"}</p>
                    <p className={styles.itemMeta}>
                      {item.vendor_name || "Seller"} · Qty {item.quantity || 0}
                    </p>
                  </div>
                  <p className={styles.itemPrice}>
                    {formatCurrency((item.unit_price || 0) * (item.quantity || 0))}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.modalSection}>
            <h3>Delivery Address</h3>
            <div className={styles.addressBlock}>
              <p>{order.customer_name || "Customer"}</p>
              <p>{shipToAddress}</p>
              <p>
                {order.ship_to_city || order.customer_city || ""}
                {order.ship_to_state || order.customer_state
                  ? `, ${order.ship_to_state || order.customer_state}`
                  : ""}
              </p>
              <p>
                {order.ship_to_country || order.customer_country || ""}
                {order.ship_to_postal_code || order.customer_postal_code
                  ? ` - ${order.ship_to_postal_code || order.customer_postal_code}`
                  : ""}
              </p>
            </div>
          </section>

          <section className={styles.modalSection}>
            <h3>Summary</h3>
            <div className={styles.summaryRows}>
              <div>
                <span>Subtotal</span>
                <strong>{formatCurrency(order.total_amount)}</strong>
              </div>
              <div>
                <span>Estimated Tax</span>
                <strong>{formatCurrency(Number(order.total_amount || 0) * 0.18)}</strong>
              </div>
              <div className={styles.summaryTotal}>
                <span>Total</span>
                <strong>{formatCurrency(Number(order.total_amount || 0) * 1.18)}</strong>
              </div>
            </div>
          </section>
        </div>

        <div className={styles.modalActions}>
          <button type="button" className={styles.softButton} onClick={() => onBuyAgain(order)}>
            <RefreshCw size={15} />
            Buy Again
          </button>
          <button type="button" className={styles.softButton} onClick={() => onNeedHelp(order)}>
            Need Help
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => onDownloadInvoice(order.id)}
            disabled={downloading}
          >
            {downloading ? <Loader2 className={styles.inlineSpinner} size={15} /> : <Download size={15} />}
            Invoice
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [downloading, setDownloading] = useState({});
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const storedCustomer = localStorage.getItem("customerUser");
        if (!storedCustomer) {
          setLoading(false);
          return;
        }

        const customerData = JSON.parse(storedCustomer);
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Please sign in to view your orders.");
          setLoading(false);
          return;
        }
        const response = await fetch(`${API_BASE_URL}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 401) {
          router.push("/SignIn");
          return;
        }
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.message || data.error || "Failed to load orders");
        }

        setOrders(data.purchaseOrders || []);
      } catch (fetchError) {
        console.error("Error fetching orders:", fetchError);
        setError(fetchError.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const summary = useMemo(() => {
    const total = orders.length;
    const active = orders.filter((order) => ACTIVE_STATUSES.includes(normalizeStatus(order.status))).length;
    const delivered = orders.filter((order) =>
      ["delivered", "completed"].includes(normalizeStatus(order.status))
    ).length;
    const totalSpent = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

    return { total, active, delivered, totalSpent };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const filtered = orders.filter((order) => {
      const matchesSearch = buildSearchText(order).includes(searchQuery.trim().toLowerCase());
      const matchesStatus =
        statusFilter === "all" || normalizeStatus(order.status) === statusFilter;

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.order_date) - new Date(b.order_date);
      }
      if (sortBy === "amount_high") {
        return Number(b.total_amount || 0) - Number(a.total_amount || 0);
      }
      if (sortBy === "amount_low") {
        return Number(a.total_amount || 0) - Number(b.total_amount || 0);
      }
      return new Date(b.order_date) - new Date(a.order_date);
    });

    return filtered;
  }, [orders, searchQuery, sortBy, statusFilter]);

  const handleDownloadInvoice = async (orderId) => {
    setDownloading((current) => ({ ...current, [orderId]: true }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/po/generate-pdf/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.error("Invoice generation failed:", response.status, errorText);
        toast.error("Failed to generate invoice");
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `Order_${orderId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
      toast.success("Invoice downloaded");
    } catch (downloadError) {
      console.error("Error downloading invoice:", downloadError);
      toast.error("Failed to download invoice");
    } finally {
      setDownloading((current) => ({ ...current, [orderId]: false }));
    }
  };

  const handlePayNow = (order) => {
    const amount = Number(order?.total_amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }
    router.push(`/customer/payment?amount=${encodeURIComponent(amount)}`);
  };

  const handleBuyAgain = (order) => {
    const productId = order.items?.[0]?.product_id;
    if (!productId) {
      toast.info("Product is not available for reorder right now");
      return;
    }

    router.push(`/customer/product/${productId}`);
  };

  const handleNeedHelp = (order) => {
    toast.info(`Support placeholder for Order #${formatOrderNumber(order.po_number, order.id)}`);
  };

  if (loading) {
    return (
      <div className={styles.loadingShell}>
        <Loader2 className={styles.loadingSpinner} />
      </div>
    );
  }

  return (
    <>
      <Navbar disableFilters disableSearch />
      <div className={styles.pageShell}>
        <main className={styles.main}>
          <section className={styles.hero}>
            <span className={styles.eyebrow}>My Orders</span>
            <h1 className={styles.heroTitle}>Track your dress orders at a glance.</h1>
            <p className={styles.heroText}>
              See order status, delivery progress, and quick actions in a familiar marketplace layout.
            </p>
          </section>

          <section className={styles.summaryGrid}>
            <article className={styles.summaryCard}>
              <p>Total Orders</p>
              <strong>{summary.total}</strong>
            </article>
            <article className={styles.summaryCard}>
              <p>Active Orders</p>
              <strong>{summary.active}</strong>
            </article>
            <article className={styles.summaryCard}>
              <p>Delivered</p>
              <strong>{summary.delivered}</strong>
            </article>
            <article className={styles.summaryCard}>
              <p>Total Spent</p>
              <strong>{formatCurrency(summary.totalSpent)}</strong>
            </article>
          </section>

          <section className={styles.toolbar}>
            <div className={styles.searchShell}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search order number, item, seller..."
              />
            </div>

            <select
              className={styles.sortSelect}
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="amount_high">Amount: High to Low</option>
              <option value="amount_low">Amount: Low to High</option>
            </select>
          </section>

          <section className={styles.filterRow}>
            {[
              { key: "all", label: "All" },
              { key: "pending", label: "Placed" },
              { key: "processing", label: "Processing" },
              { key: "approved", label: "Confirmed" },
              { key: "shipped", label: "Shipped" },
              { key: "completed", label: "Delivered" },
              { key: "cancelled", label: "Cancelled" },
            ].map((option) => (
              <button
                key={option.key}
                type="button"
                className={`${styles.filterChip} ${statusFilter === option.key ? styles.filterChipActive : ""}`}
                onClick={() => setStatusFilter(option.key)}
              >
                {option.label}
              </button>
            ))}
          </section>

          {error && <div className={styles.messageCard}>{error}</div>}

          {!error && (
            <section className={styles.ordersList}>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const statusMeta = getStatusMeta(order.status);
                  const firstItem = order.items?.[0];

                  return (
                    <article key={order.id} className={styles.orderCard}>
                      <div className={styles.orderTop}>
                        <div>
                          <div className={styles.orderMetaRow}>
                            <p className={styles.orderNumber}>
                              Order #{formatOrderNumber(order.po_number, order.id)}
                            </p>
                            <span className={`${styles.statusBadge} ${statusMeta.tone}`}>
                              {statusMeta.label}
                            </span>
                          </div>
                          <h2 className={styles.orderTitle}>{firstItem?.product_name || "Order item"}</h2>
                          <p className={styles.orderSubtext}>
                            Seller: {firstItem?.vendor_name || "Seller"} · Ordered on {formatDate(order.order_date)}
                          </p>
                          <p className={styles.orderNote}>{statusMeta.note}</p>
                        </div>

                        <div className={styles.orderAmountBlock}>
                          <strong>{formatCurrency(order.total_amount)}</strong>
                          <span>{order.items?.length || 0} item(s)</span>
                        </div>
                      </div>

                      <div className={styles.orderFooter}>
                        <div className={styles.orderInfoChips}>
                          <span>
                            <ShoppingBag size={14} />
                            Qty {firstItem?.quantity || 0}
                          </span>
                          <span>
                            <CalendarDays size={14} />
                            {formatDate(order.order_date)}
                          </span>
                        </div>

                        <div className={styles.orderActions}>
                          <button type="button" className={styles.softButton} onClick={() => setSelectedOrder(order)}>
                            View Details
                          </button>
                          <button
                            type="button"
                            className={styles.softButton}
                            onClick={() => handleDownloadInvoice(order.id)}
                            disabled={downloading[order.id]}
                          >
                            {downloading[order.id] ? (
                              <Loader2 className={styles.inlineSpinner} size={15} />
                            ) : (
                              <Download size={15} />
                            )}
                            Invoice
                          </button>
                          <button type="button" className={styles.softButton} onClick={() => handleBuyAgain(order)}>
                            <RefreshCw size={15} />
                            Buy Again
                          </button>
                          <button type="button" className={styles.softButton} onClick={() => handleNeedHelp(order)}>
                            Need Help
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className={styles.messageCard}>
                  {orders.length === 0
                    ? "No orders yet. Complete a purchase to see it here."
                    : "No orders matched your current search or filter."}
                </div>
              )}
            </section>
          )}
        </main>

        <Footer />
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          downloading={downloading[selectedOrder.id]}
          onClose={() => setSelectedOrder(null)}
          onDownloadInvoice={handleDownloadInvoice}
          onBuyAgain={handleBuyAgain}
          onNeedHelp={handleNeedHelp}
        />
      )}
    </>
  );
}
