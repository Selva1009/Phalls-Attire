
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { API_BASE_URL } from "@/lib/api";
import styles from "./transactions.module.css";

const STATUS_META = {
  verified: { label: "Success", tone: styles.statusSuccess },
  created: { label: "Pending", tone: styles.statusPending },
  failed: { label: "Failed", tone: styles.statusFailed },
  refunded: { label: "Refunded", tone: styles.statusRefunded },
  cancelled: { label: "Cancelled", tone: styles.statusCancelled },
};

const normalizeStatus = (value) => String(value || "created").toLowerCase();

const getStatusMeta = (status) =>
  STATUS_META[normalizeStatus(status)] || STATUS_META.created;

const formatCurrency = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

const formatTransactionId = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "N/A";
  if (raw.length <= 10) return raw;
  return `${raw.slice(0, 6)}...${raw.slice(-4)}`;
};

const getPaymentMethod = (payment) => {
  if (!payment) return "N/A";
  return "Razorpay";
};

const resolveAddress = (order, payload) => {
  if (order) {
    return {
      address: order.ship_to_address || order.customer_address || "",
      city: order.ship_to_city || order.customer_city || "",
      state: order.ship_to_state || order.customer_state || "",
      country: order.ship_to_country || order.customer_country || "",
      postalCode: order.ship_to_postal_code || order.customer_postal_code || "",
    };
  }

  const ship = payload?.shipToAddress || payload?.ship_to_address;
  if (!ship) return null;

  return {
    address: ship.address || ship.address_line || ship.addressLine || "",
    city: ship.city || "",
    state: ship.state || "",
    country: ship.country || "",
    postalCode:
      ship.postalCode || ship.postal_code || ship.pincode || ship.zip || "",
  };
};

const getOrderLabel = (orders) => {
  if (!orders?.length) return "N/A";
  if (orders.length === 1) return orders[0].po_number || orders[0].id;
  return `${orders.length} Orders`;
};

const getItemCount = (items) =>
  (items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);

const getProductSummary = (items) => {
  if (!items?.length) return "N/A";
  const names = items.map((item) => item.product_name).filter(Boolean);
  if (!names.length) return "N/A";
  if (names.length === 1) return names[0];
  return `${names[0]} +${names.length - 1}`;
};

function TransactionDetailModal({
  transaction,
  downloading,
  onClose,
  onDownloadInvoice,
  onRetryPayment,
  onViewOrder,
}) {
  if (!transaction) return null;

  const { payment, orders, items, payload } = transaction;
  const statusMeta = getStatusMeta(payment.status);
  const address = resolveAddress(orders?.[0], payload);
  const customerName =
    payment.customer_name ||
    payment.customerName ||
    payment.customer_company ||
    "Customer";
  const customerEmail = payment.customer_email || payment.Email || "N/A";
  const paymentDate = payment.verified_at || payment.created_at;
  const orderLabel = getOrderLabel(orders);
  const totalAmount = Number(payment.amount || 0);
  const discountAmount = 0;
  const taxLabel = "Included";
  const finalAmount = totalAmount;

  const displayItems =
    items?.length > 0
      ? items
      : payload?.items?.map((item) => ({
          product_name: `Product #${item.productId || "Item"}`,
          quantity: item.quantity || 0,
          unit_price: item.unitPrice || 0,
        })) || [];
  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.modalEyebrow}>Transaction Details</p>
            <h2 className={styles.modalTitle}>
              Transaction {payment.razorpay_payment_id || payment.razorpay_order_id || payment.id}
            </h2>
            <p className={styles.modalSubtitle}>Processed on {formatDateTime(paymentDate)}</p>
          </div>
          <button type="button" className={styles.modalClose} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalStatusRow}>
          <span className={`${styles.statusBadge} ${statusMeta.tone}`}>
            {statusMeta.label}
          </span>
          <span className={styles.modalStatusNote}>
            {normalizeStatus(payment.status) === "failed"
              ? "Payment did not complete."
              : normalizeStatus(payment.status) === "created"
                ? "Payment pending verification."
                : normalizeStatus(payment.status) === "refunded"
                  ? "Refund processed."
                  : "Payment verified successfully."}
          </span>
        </div>

        <div className={styles.modalGrid}>
          <section className={styles.modalSection}>
            <h3>Order & Customer</h3>
            <div className={styles.modalRow}>
              <span>Order</span>
              <strong>{orderLabel}</strong>
            </div>
            <div className={styles.modalRow}>
              <span>Customer</span>
              <strong>{customerName}</strong>
            </div>
            <div className={styles.modalRow}>
              <span>Email</span>
              <strong>{customerEmail}</strong>
            </div>
            <div className={styles.modalRow}>
              <span>Payment method</span>
              <strong>{getPaymentMethod(payment)}</strong>
            </div>
            <div className={styles.modalRow}>
              <span>Gateway reference</span>
              <strong>{payment.razorpay_payment_id || payment.razorpay_order_id || "N/A"}</strong>
            </div>
            <div className={styles.modalRow}>
              <span>Refund info</span>
              <strong>
                {normalizeStatus(payment.status) === "refunded" ? "Refund processed" : "N/A"}
              </strong>
            </div>
            <div className={styles.modalRow}>
              <span>Failure reason</span>
              <strong>
                {normalizeStatus(payment.status) === "failed" ? "Not available" : "N/A"}
              </strong>
            </div>
          </section>

          <section className={styles.modalSection}>
            <h3>Amount Breakdown</h3>
            <div className={styles.modalRow}>
              <span>Subtotal</span>
              <strong>{formatCurrency(totalAmount)}</strong>
            </div>
            <div className={styles.modalRow}>
              <span>Discount</span>
              <strong>{formatCurrency(discountAmount)}</strong>
            </div>
            <div className={styles.modalRow}>
              <span>Tax / GST</span>
              <strong>{taxLabel}</strong>
            </div>
            <div className={`${styles.modalRow} ${styles.modalRowTotal}`}>
              <span>Final paid</span>
              <strong>{formatCurrency(finalAmount)}</strong>
            </div>
          </section>

          <section className={styles.modalSection}>
            <h3>Products</h3>
            <div className={styles.modalItemList}>
              {displayItems.length ? (
                displayItems.map((item, index) => (
                  <div key={`${item.product_name}-${index}`} className={styles.modalItem}>
                    <div>
                      <p className={styles.modalItemTitle}>
                        {item.product_name || "Order item"}
                      </p>
                      <p className={styles.modalItemMeta}>
                        Qty {item.quantity || 0}
                      </p>
                    </div>
                    <strong>
                      {item.total_price
                        ? formatCurrency(item.total_price)
                        : formatCurrency(
                            Number(item.unit_price || 0) * Number(item.quantity || 0)
                          )}
                    </strong>
                  </div>
                ))
              ) : (
                <div className={styles.modalEmpty}>No product details available.</div>
              )}
            </div>
          </section>

          <section className={styles.modalSection}>
            <h3>Billing Address</h3>
            {address ? (
              <div className={styles.modalAddress}>
                <p>{address.address || "N/A"}</p>
                <p>
                  {[address.city, address.state].filter(Boolean).join(", ")}
                </p>
                <p>
                  {[address.country, address.postalCode].filter(Boolean).join(" ")}
                </p>
              </div>
            ) : (
              <div className={styles.modalEmpty}>Address not available.</div>
            )}
          </section>
        </div>

        <div className={styles.modalFooter}>
          <div className={styles.modalActions}>
            {orders?.length ? (
              <button
                type="button"
                className={styles.actionButton}
                onClick={() => onViewOrder(orders[0])}
              >
                <ExternalLink size={14} />
                View Order
              </button>
            ) : null}
            {normalizeStatus(payment.status) === "failed" ||
            normalizeStatus(payment.status) === "created" ? (
              <button
                type="button"
                className={styles.actionButton}
                onClick={() => onRetryPayment(transaction)}
              >
                <RefreshCw size={14} />
                Retry Payment
              </button>
            ) : null}
          </div>
          <div className={styles.modalActions}>
            {orders?.length ? (
              orders.map((order) => (
                <button
                  key={`invoice-${order.id}`}
                  type="button"
                  className={styles.actionPrimary}
                  onClick={() => onDownloadInvoice(order.id)}
                  disabled={downloading[order.id]}
                >
                  {downloading[order.id] ? (
                    <Loader2 size={14} className={styles.inlineSpinner} />
                  ) : (
                    <Download size={14} />
                  )}
                  Invoice #{order.po_number || order.id}
                </button>
              ))
            ) : (
              <button type="button" className={styles.actionGhost} disabled>
                <FileText size={14} />
                Invoice not available
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [stats, setStats] = useState({ total: 0, byStatus: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [downloading, setDownloading] = useState({});
  const [customerMeta, setCustomerMeta] = useState(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("customerUser");
    if (stored) {
      try {
        setCustomerMeta(JSON.parse(stored));
      } catch {
        setCustomerMeta(null);
      }
    }
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [statusFilter, searchQuery, dateRange.from, dateRange.to]);

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 401) {
          router.push("/Home");
          return;
        }
        const data = await response.json().catch(() => ({}));
        if (response.ok) {
          setOrders(Array.isArray(data.purchaseOrders) ? data.purchaseOrders : []);
        }
      } catch {
        setOrders([]);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please sign in to view transactions.");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      params.set("page", String(pagination.page));
      params.set("pageSize", String(pagination.pageSize));
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (searchQuery) params.set("search", searchQuery);
      if (dateRange.from) params.set("from", dateRange.from);
      if (dateRange.to) params.set("to", dateRange.to);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/payments/history?${params.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.status === 401) {
          router.push("/Home");
          return;
        }

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message || "Failed to load transactions");
        }

        setPayments(Array.isArray(data.payments) ? data.payments : []);
        setPagination((prev) => ({
          ...prev,
          ...data.pagination,
        }));
        setStats(data.stats || { total: 0, byStatus: {} });
      } catch (fetchError) {
        setError(fetchError.message || "Failed to load transactions");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [
    pagination.page,
    pagination.pageSize,
    statusFilter,
    searchQuery,
    dateRange.from,
    dateRange.to,
  ]);

  const ordersByPaymentId = useMemo(() => {
    const map = new Map();
    orders.forEach((order) => {
      if (!order.payment_id) return;
      const list = map.get(order.payment_id) || [];
      list.push(order);
      map.set(order.payment_id, list);
    });
    return map;
  }, [orders]);

  const transactions = useMemo(
    () =>
      payments.map((payment) => {
        const orderList = ordersByPaymentId.get(payment.id) || [];
        const itemList = orderList.flatMap((order) => order.items || []);
        const payload = payment.order_payload || null;
        return {
          payment,
          orders: orderList,
          items: itemList,
          payload,
          itemCount: getItemCount(itemList),
          orderLabel: getOrderLabel(orderList),
          productSummary: getProductSummary(itemList),
          customerLabel:
            payment.customer_name ||
            customerMeta?.personName ||
            customerMeta?.companyName ||
            "Customer",
        };
      }),
    [payments, ordersByPaymentId, customerMeta]
  );

  const visibleTransactions = useMemo(() => {
    if (methodFilter === "all") return transactions;
    const selectedMethod = methodFilter.toLowerCase();
    return transactions.filter((transaction) =>
      getPaymentMethod(transaction.payment).toLowerCase().includes(selectedMethod)
    );
  }, [transactions, methodFilter]);

  const summary = useMemo(() => {
    const byStatus = stats.byStatus || {};
    const success = byStatus.verified?.count || 0;
    const pending = byStatus.created?.count || 0;
    const failed =
      (byStatus.failed?.count || 0) +
      (byStatus.refunded?.count || 0) +
      (byStatus.cancelled?.count || 0);
    const failedAmount =
      (byStatus.failed?.amount || 0) +
      (byStatus.refunded?.amount || 0) +
      (byStatus.cancelled?.amount || 0);
    return {
      total: stats.total || 0,
      success,
      pending,
      failed,
      failedAmount,
    };
  }, [stats]);

  const handleDownloadInvoice = async (orderId) => {
    if (!orderId) return;
    setDownloading((current) => ({ ...current, [orderId]: true }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/po/generate-pdf/${orderId}`);
      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.error("Invoice generation failed:", response.status, errorText);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `Invoice_${orderId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
    } finally {
      setDownloading((current) => ({ ...current, [orderId]: false }));
    }
  };

  const handleRetryPayment = (transaction) => {
    const amount = Number(transaction?.payment?.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) return;
    const storedCustomer = localStorage.getItem("customerUser");
    const customerId = storedCustomer ? JSON.parse(storedCustomer)?.id : null;
    const payload = transaction?.payload || {};
    const pendingPayment = {
      customerId: customerId || transaction.payment.customer_id || null,
      items: Array.isArray(payload.items) ? payload.items : [],
      totalAmount: amount,
      shipToAddress: payload.shipToAddress || null,
      createdAt: Date.now(),
    };
    localStorage.setItem("pendingPayment", JSON.stringify(pendingPayment));
    router.push("/customer/payment");
  };

  const handleViewOrder = () => {
    router.push("/customer/PoAutomation");
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setStatusFilter("all");
    setMethodFilter("all");
    setDateRange({ from: "", to: "" });
    setPagination((prev) => ({ ...prev, page: 1 }));
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
      <Navbar disableFilters disableSearch hideCategories />
      <div className={styles.pageShell}>
        <header className={styles.pageHeader}>
          <div>
            <span className={styles.eyebrow}>Payments</span>
            <h1 className={styles.title}>Transactions</h1>
            <p className={styles.subtitle}>
              Track every payment, invoice, and order update in one place.
            </p>
          </div>
        </header>

        <section className={styles.summaryGrid}>
          <article className={styles.summaryCard}>
            <p>Total Transactions</p>
            <strong>{summary.total}</strong>
            <span>All-time payments</span>
          </article>
          <article className={styles.summaryCard}>
            <p>Successful Payments</p>
            <strong>{summary.success}</strong>
            <span>Verified transactions</span>
          </article>
          <article className={styles.summaryCard}>
            <p>Pending Payments</p>
            <strong>{summary.pending}</strong>
            <span>Awaiting confirmation</span>
          </article>
          <article className={styles.summaryCard}>
            <p>Refunded / Failed</p>
            <strong>
              {summary.failedAmount
                ? formatCurrency(summary.failedAmount)
                : summary.failed}
            </strong>
            <span>{summary.failed} transactions</span>
          </article>
        </section>

        <section className={styles.filtersCard}>
          <div className={styles.searchBox}>
            <Search size={16} />
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search transaction ID, order ID, customer, product..."
            />
          </div>
          <div className={styles.filterRow}>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="verified">Success</option>
              <option value="created">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              className={styles.filterSelect}
              value={methodFilter}
              onChange={(event) => setMethodFilter(event.target.value)}
            >
              <option value="all">All methods</option>
              <option value="razorpay">Razorpay</option>
            </select>
            <input
              type="date"
              className={styles.dateInput}
              value={dateRange.from}
              onChange={(event) =>
                setDateRange((prev) => ({ ...prev, from: event.target.value }))
              }
            />
            <input
              type="date"
              className={styles.dateInput}
              value={dateRange.to}
              onChange={(event) =>
                setDateRange((prev) => ({ ...prev, to: event.target.value }))
              }
            />
            <button type="button" className={styles.resetButton} onClick={resetFilters}>
              Reset filters
            </button>
          </div>
        </section>

        {error && <div className={styles.errorCard}>{error}</div>}

        {!error && (
          <section className={styles.tableCard}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date & Time</th>
                    <th>Items</th>
                    <th>Total Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Invoice</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleTransactions.length ? (
                    visibleTransactions.map((transaction) => {
                      const { payment, orders, items, itemCount } = transaction;
                      const statusMeta = getStatusMeta(payment.status);
                      const method = getPaymentMethod(payment);
                      const orderLabel = getOrderLabel(orders);
                      const transactionId =
                        payment.razorpay_payment_id || payment.razorpay_order_id || payment.id;

                      return (
                        <tr key={payment.id}>
                          <td>
                            <div className={styles.cellStack}>
                              <span title={transactionId}>{formatTransactionId(transactionId)}</span>
                              <small>#{payment.id}</small>
                            </div>
                          </td>
                          <td>{orderLabel}</td>
                          <td className={styles.cellStack}>
                            <span>{transaction.customerLabel}</span>
                            <small>{payment.customer_email || customerMeta?.Email || "N/A"}</small>
                          </td>
                          <td>{formatDateTime(payment.verified_at || payment.created_at)}</td>
                          <td>
                            <div className={styles.cellStack}>
                              <span>{itemCount || items.length || 0}</span>
                              <small>{getProductSummary(items)}</small>
                            </div>
                          </td>
                          <td className={styles.amountCell}>{formatCurrency(payment.amount)}</td>
                          <td>{method}</td>
                          <td>
                            <span className={`${styles.statusBadge} ${statusMeta.tone}`}>
                              {statusMeta.label}
                            </span>
                          </td>
                          <td>
                            {orders.length === 1 ? (
                              <button
                                type="button"
                                className={styles.tableLink}
                                onClick={() => handleDownloadInvoice(orders[0].id)}
                                disabled={downloading[orders[0].id]}
                              >
                                {downloading[orders[0].id] ? (
                                  <Loader2 size={14} className={styles.inlineSpinner} />
                                ) : (
                                  <Download size={14} />
                                )}
                                Invoice
                              </button>
                            ) : (
                              <span className={styles.mutedText}>N/A</span>
                            )}
                          </td>
                          <td>
                            <div className={styles.tableActions}>
                              <button
                                type="button"
                                className={styles.actionButton}
                                onClick={() => setSelectedTransaction(transaction)}
                              >
                                View Details
                              </button>
                              {(normalizeStatus(payment.status) === "failed" ||
                                normalizeStatus(payment.status) === "created") && (
                                <button
                                  type="button"
                                  className={styles.actionGhost}
                                  onClick={() => handleRetryPayment(transaction)}
                                >
                                  Retry
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10}>
                        <div className={styles.emptyState}>
                          No transactions found for the selected filters.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {visibleTransactions.length > 0 && (
              <div className={styles.mobileList}>
                {visibleTransactions.map((transaction) => {
                  const { payment, orders, items } = transaction;
                  const statusMeta = getStatusMeta(payment.status);
                  return (
                    <article key={`mobile-${payment.id}`} className={styles.mobileCard}>
                      <div className={styles.mobileCardTop}>
                        <div>
                          <p>{formatTransactionId(payment.razorpay_payment_id || payment.razorpay_order_id || payment.id)}</p>
                          <span>{formatDateTime(payment.verified_at || payment.created_at)}</span>
                        </div>
                        <span className={`${styles.statusBadge} ${statusMeta.tone}`}>
                          {statusMeta.label}
                        </span>
                      </div>
                      <div className={styles.mobileCardBody}>
                        <div>
                          <h4>{transaction.orderLabel}</h4>
                          <span>{getProductSummary(items)}</span>
                        </div>
                        <strong>{formatCurrency(payment.amount)}</strong>
                      </div>
                      <div className={styles.mobileCardActions}>
                        <button
                          type="button"
                          className={styles.actionButton}
                          onClick={() => setSelectedTransaction(transaction)}
                        >
                          View Details
                        </button>
                        {orders.length === 1 && (
                          <button
                            type="button"
                            className={styles.actionGhost}
                            onClick={() => handleDownloadInvoice(orders[0].id)}
                            disabled={downloading[orders[0].id]}
                          >
                            Invoice
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {pagination.totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  type="button"
                  className={styles.pageButton}
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                  }
                >
                  Prev
                </button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, index) => {
                  const startPage = Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4));
                  const pageNumber = startPage + index;
                  if (pageNumber > pagination.totalPages) return null;
                  return (
                    <button
                      key={`page-${pageNumber}`}
                      type="button"
                      className={`${styles.pageButton} ${
                        pagination.page === pageNumber ? styles.pageActive : ""
                      }`}
                      onClick={() => setPagination((prev) => ({ ...prev, page: pageNumber }))}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                <button
                  type="button"
                  className={styles.pageButton}
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.min(prev.page + 1, pagination.totalPages),
                    }))
                  }
                >
                  Next
                </button>
              </div>
            )}
          </section>
        )}
      </div>

      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          downloading={downloading}
          onClose={() => setSelectedTransaction(null)}
          onDownloadInvoice={handleDownloadInvoice}
          onRetryPayment={handleRetryPayment}
          onViewOrder={handleViewOrder}
        />
      )}
    </>
  );
}



