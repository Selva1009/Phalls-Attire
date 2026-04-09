"use client";
import { API_BASE_URL } from "@/lib/api";
import { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Download,
  ArrowLeft,
  Loader2,
  Search,
  Check,
  X,
  Edit,
  MapPin,
  Building2,
  User,
  Truck,
  ListOrdered,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import { Button } from "@/components/ui/button";
import { FaSearch } from "react-icons/fa";

const DetailField = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500 mb-1">{ label }</p>
    <p className="text-sm font-medium text-gray-900 break-words">
      { value || "N/A" }
    </p>
  </div>
);

const VendorPOAutomationPage = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPO, setSelectedPO] = useState(null);
  const [downloading, setDownloading] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editing, setEditing] = useState(false);
  const [showCustomerAddress, setShowCustomerAddress] = useState(false);
  const [showVendorAddress, setShowVendorAddress] = useState(false);
  const [showShipToAddress, setShowShipToAddress] = useState(false);
  const [editingShipTo, setEditingShipTo] = useState(false);
  const [shipToForm, setShipToForm] = useState({});
  const [deliveryNotes, setDeliveryNotes] = useState("");

  const [editData, setEditData] = useState({
    status: "",
  });
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchPurchaseOrders = async () => {
      try {
        const storedVendor = localStorage.getItem("vendorUser");
        if (!storedVendor) {
          setLoading(false);
          return;
        }

        const vendorData = JSON.parse(storedVendor);
        const response = await fetch(
          `${API_BASE_URL}/api/PoVendorUser/vendor/${vendorData.id}`
        );
        const data = await response.json();

        if (response.ok) {
          setPurchaseOrders(data.purchaseOrders || []);
        } else {
          toast.error("Failed to load purchase orders");
        }
      } catch (error) {
        console.error("Error fetching purchase orders:", error);
        toast.error("Error fetching purchase orders");
      } finally {
        setLoading(false);
      }
    };

    fetchPurchaseOrders();
  }, []);

  const filteredPOs = useMemo(() => {
    if (!searchTerm) return purchaseOrders;

    return purchaseOrders.filter((po) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        po.po_number?.toLowerCase().includes(searchLower) ||
        po.customer_name?.toLowerCase().includes(searchLower) ||
        po.customer_company?.toLowerCase().includes(searchLower) ||
        po.items?.[0]?.product_name?.toLowerCase().includes(searchLower) ||
        po.status?.toLowerCase().includes(searchLower)
      );
    });
  }, [purchaseOrders, searchTerm]);

  const totalPages = Math.ceil(filteredPOs.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPOs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPOs, currentPage]);

  const handleDownloadPDF = async (poId) => {
    setDownloading((prev) => ({ ...prev, [poId]: true }));
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/po/generate-pdf/${poId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `PO_${poId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("PDF downloaded successfully");
      } else {
        toast.error("Failed to generate PDF");
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Error generating PDF");
    } finally {
      setDownloading((prev) => ({ ...prev, [poId]: false }));
    }
  };

  const handleEditClick = (po) => {
    setEditing(true);
    setSelectedPO(po);
    setEditData({
      status: po.status || "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveChanges = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/PoVendorUser/update/${selectedPO.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: editData.status,
          }),
        }
      );

      if (response.ok) {
        setPurchaseOrders((prev) =>
          prev.map((po) =>
            po.id === selectedPO.id
              ? {
                ...po,
                status: editData.status,
              }
              : po
          )
        );

        setSelectedPO((prev) => ({
          ...prev,
          status: editData.status,
        }));

        setEditing(false);
        toast.success("PO status updated successfully");
      } else {
        toast.error("Failed to update PO status");
      }
    } catch (error) {
      console.error("Error updating PO status:", error);
      toast.error("Error updating PO status");
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditData({
      status: "",
    });
  };

  useEffect(() => {
    const fetchDeliveryNotes = async () => {
      if (!selectedPO?.id) return;

      try {
        const res = await fetch(
          `${API_BASE_URL}/api/po/${selectedPO.id}/delivery-notes`
        );
        const data = await res.json();

        if (res.ok) {
          setDeliveryNotes(data.deliveryNotes || "");
        } else {
          console.error("Error fetching delivery notes:", data.error);
        }
      } catch (err) {
        console.error("Failed to fetch delivery notes:", err);
      }
    };

    fetchDeliveryNotes();
  }, [selectedPO?.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen  bg-gradient-to-br from-gray-50 to-gray-100">
        <ToastContainer position="bottom-right" autoClose={ 3000 } />



        {/* Main Content */ }
        { selectedPO ? (
          <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <div className="flex justify-between mt-6">
              <Button
                onClick={ () => setSelectedPO(null) }
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft size={ 16 } />
                Back to All POs
              </Button>
            </div>
            {/* PO Header */ }
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
                PURCHASE ORDER
              </h1>
              <div className="border-t-2 border-b-2 border-gray-200 py-3 bg-blue-50 rounded-lg">
                <div className="flex flex-col sm:flex-row justify-between items-center px-4 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700">
                      PO Number:
                    </span>
                    <span className="font-semibold text-blue-600">
                      { selectedPO.po_number }
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-700">Date:</span>
                    <span className="font-semibold">
                      { new Date(selectedPO.order_date).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      ) }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Three Column Layout */ }
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Vendor Card */ }
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-100">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Vendor Details
                  </h3>
                </div>
                <div className="space-y-3">
                  <DetailField
                    label="Name"
                    value={ selectedPO.items[0]?.vendor_name }
                  />
                  <DetailField
                    label="Company"
                    value={ selectedPO.items[0]?.vendor_company }
                  />
                  <DetailField
                    label="Email"
                    value={ selectedPO.items[0]?.vendor_email }
                  />
                  <DetailField
                    label="Address"
                    value={ selectedPO.items[0]?.vendor_address }
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <DetailField
                      label="City"
                      value={ selectedPO.items[0]?.vendor_city }
                    />
                    <DetailField
                      label="State"
                      value={ selectedPO.items[0]?.vendor_state }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <DetailField
                      label="Country"
                      value={ selectedPO.items[0]?.vendor_country }
                    />
                    <DetailField
                      label="Postal Code"
                      value={ selectedPO.items[0]?.vendor_postal_code }
                    />
                  </div>
                </div>
              </div>

              {/* Customer Card */ }
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-100">
                  <User className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Customer Details
                  </h3>
                </div>
                <div className="space-y-3">
                  <DetailField label="Name" value={ selectedPO.customer_name } />
                  <DetailField
                    label="Company"
                    value={ selectedPO.customer_company }
                  />
                  <DetailField
                    label="Email"
                    value={ selectedPO.customer_email }
                  />
                  <DetailField
                    label="Address"
                    value={ selectedPO.customer_address }
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <DetailField
                      label="City"
                      value={ selectedPO.customer_city }
                    />
                    <DetailField
                      label="State"
                      value={ selectedPO.customer_state }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <DetailField
                      label="Country"
                      value={ selectedPO.customer_country }
                    />
                    <DetailField
                      label="Postal Code"
                      value={ selectedPO.customer_postal_code }
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Card */ }
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">
                      Shipping Address
                    </h3>
                  </div>
                </div>

                <div className="space-y-3">
                  <DetailField label="Name" value={ selectedPO.customer_name } />
                  <DetailField
                    label="Company"
                    value={ selectedPO.customer_company }
                  />
                  <DetailField
                    label="Address"
                    value={
                      selectedPO.ship_to_address || selectedPO.customer_address
                    }
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <DetailField
                      label="City"
                      value={
                        selectedPO.ship_to_city || selectedPO.customer_city
                      }
                    />
                    <DetailField
                      label="State"
                      value={
                        selectedPO.ship_to_state || selectedPO.customer_state
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <DetailField
                      label="Country"
                      value={
                        selectedPO.ship_to_country ||
                        selectedPO.customer_country
                      }
                    />
                    <DetailField
                      label="Postal Code"
                      value={
                        selectedPO.ship_to_postal_code ||
                        selectedPO.customer_postal_code
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Items Section */ }
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <ListOrdered className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Order Items
                </h3>
              </div>

              <div className="relative overflow-visible z-20">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price/Unit
                      </th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    { selectedPO.items.map((item, index) => (
                      <tr key={ index } className="hover:bg-gray-50">
                        <td className="px-5 py-4 whitespace-nowrap max-w-xs relative group">
                          <div className="text-sm text-gray-900 truncate">
                            { item.product_name }
                          </div>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap max-w-xs relative group">
                          <div className="text-sm text-gray-900 truncate">
                            { item.description || "-" }
                          </div>
                          { item.description && (
                            <div className="absolute max-w-lg left-0 top-full mt-1 z-50 hidden group-hover:block w-64 bg-white text-gray-800 text-xs p-2 rounded shadow-lg border border-gray-300">
                              { item.description }
                            </div>
                          ) }
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                          { item.quantity }
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500">
                          ₹{ item.unit_price.toLocaleString() }
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ₹{ (item.unit_price * item.quantity).toLocaleString() }
                        </td>
                      </tr>
                    )) }
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Section */ }
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Order Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">
                      ₹{ selectedPO.total_amount.toLocaleString() }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">CGST (9%):</span>
                    <span className="font-medium">
                      ₹{ (selectedPO.total_amount * 0.09).toLocaleString() }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">SGST (9%):</span>
                    <span className="font-medium">
                      ₹{ (selectedPO.total_amount * 0.09).toLocaleString() }
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <span className="text-gray-800 font-semibold">
                      Grand Total:
                    </span>
                    <span className="text-blue-600 font-bold">
                      ₹{ (selectedPO.total_amount * 1.18).toLocaleString() }
                    </span>
                  </div>
                </div>
              </div>

              {/* Status and Notes */ }
              <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Order Status
                  </h3>
                  { editing ? (
                    <div className="flex gap-2">
                      <Button
                        onClick={ handleSaveChanges }
                        size="sm"
                        className="h-8"
                      >
                        <Check size={ 14 } className="mr-1" />
                        Save
                      </Button>
                      <Button
                        onClick={ handleCancelEdit }
                        variant="outline"
                        size="sm"
                        className="h-8"
                      >
                        <X size={ 14 } className="mr-1" />
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={ () => handleEditClick(selectedPO) }
                      variant="ghost"
                      size="sm"
                      className="h-8"
                    >
                      <Edit size={ 14 } className="mr-1" />
                      Edit
                    </Button>
                  ) }
                </div>

                <div className="space-y-3">
                  { editing ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Status
                      </label>
                      <select
                        name="status"
                        value={ editData.status }
                        onChange={ handleEditChange }
                        className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                      >
                        <option value="">Select new status</option>
                        <option value="Pending">Pending</option>
                        <option value="PO-Acknowledgement">
                          PO-Acknowledgement
                        </option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Payment Success">Payment Success</option>
                      </select>
                    </div>
                  ) : (
                    <div
                      className={ `px-3 py-2 rounded-md inline-block ${selectedPO.status === "Pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : selectedPO.status === "PO-Acknowledgement"
                            ? "bg-blue-100 text-blue-800"
                            : selectedPO.status === "Delivered"
                              ? "bg-green-100 text-green-800"
                              : selectedPO.status === "Cancelled"
                                ? "bg-red-100 text-red-800"
                                : selectedPO.status === "Payment Success"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-gray-100 text-gray-800"
                        }` }
                    >
                      { selectedPO.status || "PENDING" }
                    </div>
                  ) }
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Remarks
                      </h3>
                    </div>
                    {/* <textarea
                      value={ deliveryNotes }
                      readOnly
                      placeholder="Add any special delivery instructions..."
                      className="w-full px-3 py-2 border rounded-md text-sm bg-gray-100 cursor-not-allowed"
                      rows={ 3 }
                    /> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 md:p-8 max-w-7xl mx-auto">
            {/* Hero Section - Only shown when not viewing a specific PO */ }
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Vendor Purchase Orders
              </h1>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <p className="text-gray-600">
                  { filteredPOs.length > 0
                    ? `Showing ${filteredPOs.length} purchase ${filteredPOs.length === 1 ? "order" : "orders"
                    }`
                    : "No purchase orders found" }
                </p>
                <div className="relative w-full md:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search POs..."
                    value={ searchTerm }
                    onChange={ (e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1); // Reset to first page when searching
                    } }
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PO Number
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    { currentItems.length > 0 ? (
                      currentItems.map((po) => (
                        <tr key={ po.id } className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-blue-600">
                              { po.po_number }
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              { new Date(po.order_date).toLocaleDateString() }
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              { po.customer_name }
                            </div>
                            <div className="text-sm text-gray-500">
                              { po.customer_company }
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-900">
                              { po.items?.[0]?.product_name }
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 relative group w-max max-w-[200px]">
                              <span className="truncate block">
                                { (po.items?.[0]?.description || "")
                                  .split(" ")
                                  .slice(0, 3)
                                  .join(" ") + "..." }
                              </span>
                              { po.items?.[0]?.description && (
                                <div className="absolute z-10 hidden group-hover:block bg-white border border-gray-300 text-gray-900 text-xs p-2 rounded shadow-md w-64 top-full mt-1">
                                  { po.items[0].description }
                                </div>
                              ) }
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              ₹{ po.total_amount.toLocaleString() }
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              { po.items?.[0]?.quantity }
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={ `px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${po.status === "Pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : po.status === "PO-Acknowledgement"
                                    ? "bg-blue-100 text-blue-800"
                                    : po.status === "Delivered"
                                      ? "bg-green-100 text-green-800"
                                      : po.status === "Cancelled"
                                        ? "bg-red-100 text-red-800"
                                        : po.status === "Payment Success"
                                          ? "bg-purple-100 text-purple-800"
                                          : "bg-gray-100 text-gray-800"
                                }` }
                            >
                              { po.status }
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={ () => setSelectedPO(po) }
                                variant="ghost"
                                size="sm"
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                onClick={ () => handleDownloadPDF(po.id) }
                                disabled={ downloading[po.id] }
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:text-green-900"
                              >
                                { downloading[po.id] ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4 mr-1" />
                                ) }
                                PDF
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="9"
                          className="px-4 py-6 text-center text-gray-500"
                        >
                          No purchase orders found
                        </td>
                      </tr>
                    ) }
                  </tbody>
                </table>
              </div>

              {/* Pagination */ }
              { filteredPOs.length > 0 && (
                <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Button
                      onClick={ () =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={ currentPage === 1 }
                      variant="outline"
                      size="sm"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={ () =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={ currentPage === totalPages }
                      variant="outline"
                      size="sm"
                      className="ml-3"
                    >
                      Next
                    </Button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{ " " }
                        <span className="font-medium">
                          { (currentPage - 1) * itemsPerPage + 1 }
                        </span>{ " " }
                        to{ " " }
                        <span className="font-medium">
                          { Math.min(
                            currentPage * itemsPerPage,
                            filteredPOs.length
                          ) }
                        </span>{ " " }
                        of{ " " }
                        <span className="font-medium">{ filteredPOs.length }</span>{ " " }
                        results
                      </p>
                    </div>
                    <div>
                      <nav
                        className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                        aria-label="Pagination"
                      >
                        <button
                          onClick={ () => setCurrentPage(1) }
                          disabled={ currentPage === 1 }
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">First</span>
                          &laquo;
                        </button>
                        <button
                          onClick={ () =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={ currentPage === 1 }
                          className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Previous</span>
                          &lsaquo;
                        </button>
                        { Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            return (
                              <button
                                key={ pageNum }
                                onClick={ () => setCurrentPage(pageNum) }
                                className={ `relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum
                                    ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                    : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                                  }` }
                              >
                                { pageNum }
                              </button>
                            );
                          }
                        ) }
                        <button
                          onClick={ () =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages)
                            )
                          }
                          disabled={ currentPage === totalPages }
                          className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Next</span>
                          &rsaquo;
                        </button>
                        <button
                          onClick={ () => setCurrentPage(totalPages) }
                          disabled={ currentPage === totalPages }
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Last</span>
                          &raquo;
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              ) }
            </div>
          </div>
        ) }
      </div>
    </>
  );
};

export default VendorPOAutomationPage;
