"use client";

import { API_BASE_URL } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Phone,
  ShoppingBag,
  UserRound,
  Building2,
  PencilLine,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Swal from "sweetalert2";
import Footer from "@/app/LandingPage/Footer";
import { Box } from "@mui/material";
 

const formatDate = (value) => {
  if (!value) return "Recently";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const CustomerProfile = ({ initialSection = "order-history" }) => {
  const [customerUser, setCustomerUser] = useState(null);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [activeSection, setActiveSection] = useState("order-history");
  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    address_line: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [formData, setFormData] = useState({
    companyName: "",
    personName: "",
    Email: "",
    contactNumber: "",
    status: "",
    id: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
 

  useEffect(() => {
    const loadUserData = () => {
      const storedUser = localStorage.getItem("customerUser");
      if (!storedUser) {
        router.push("/SignIn");
        return;
      }

      try {
        const userData = JSON.parse(storedUser);
        setCustomerUser(userData);
        setFormData({
          companyName: userData.companyName || "",
          personName: userData.personName || "",
          Email: userData.Email || "",
          contactNumber: userData.contactNumber || "",
          status: userData.status || "",
          id: userData.id || "",
        });
    } catch (error) {
      console.error("Error parsing user data:", error);
      router.push("/SignIn");
    }
  };

    loadUserData();

    const handleStorageChange = () => {
      loadUserData();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [router]);

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 401) {
          router.push("/SignIn");
          return;
        }
        const data = await response.json();

        if (response.ok) {
          setPurchaseOrders(data.purchaseOrders || []);
        }
      } catch (error) {
        console.error("Error fetching purchase orders:", error);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  useEffect(() => {
    const loadAddresses = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      setAddressLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/address`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 401) {
          router.push("/SignIn");
          return;
        }
        const data = await response.json();
        if (response.ok) {
          setAddresses(Array.isArray(data.addresses) ? data.addresses : []);
        } else {
          console.error("Failed to load addresses:", data.message || "Unknown error");
        }
      } catch (error) {
        console.error("Failed to load addresses:", error);
      } finally {
        setAddressLoading(false);
      }
    };

    loadAddresses();
  }, []);

  const addressSummary = useMemo(() => {
    const latestOrder = purchaseOrders[0];
    if (!latestOrder) {
      return {
        address: "No address available yet",
        city: "Add an order to populate this section",
        country: "India",
      };
    }

    return {
      address: latestOrder.ship_to_address || latestOrder.customer_address || "Address pending",
      city:
        latestOrder.ship_to_city ||
        latestOrder.customer_city ||
        "City pending",
      country:
        latestOrder.ship_to_country ||
        latestOrder.customer_country ||
        "India",
      state:
        latestOrder.ship_to_state ||
        latestOrder.customer_state ||
        "State pending",
      postalCode:
        latestOrder.ship_to_postal_code ||
        latestOrder.customer_postal_code ||
        "Postal code pending",
    };
  }, [purchaseOrders]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddressChange = (event) => {
    const { name, value } = event.target;
    setAddressForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetAddressForm = () => {
    setAddressForm({
      name: "",
      phone: "",
      address_line: "",
      city: "",
      state: "",
      pincode: "",
    });
    setEditingAddressId(null);
  };

  const handleAddressSubmit = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/SignIn");
      return;
    }

    const payload = {
      name: addressForm.name.trim(),
      phone: addressForm.phone.trim(),
      address_line: addressForm.address_line.trim(),
      city: addressForm.city.trim(),
      state: addressForm.state.trim(),
      pincode: addressForm.pincode.trim(),
    };

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/address${editingAddressId ? `/${editingAddressId}` : ""}`,
        {
          method: editingAddressId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );
      if (response.status === 401) {
        router.push("/SignIn");
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to save address");
      }

      if (editingAddressId) {
        setAddresses((prev) =>
          prev.map((address) => (address.id === editingAddressId ? data.address : address))
        );
      } else {
        setAddresses((prev) => [data.address, ...prev]);
      }

      resetAddressForm();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Address save failed",
        text: error.message || "Could not save the address.",
        confirmButtonColor: "#d81b60",
      });
    }
  };

  const handleAddressEdit = (address) => {
    setEditingAddressId(address.id);
    setAddressForm({
      name: address.name || "",
      phone: address.phone || "",
      address_line: address.address_line || "",
      city: address.city || "",
      state: address.state || "",
      pincode: address.pincode || "",
    });
  };

  const handleAddressDelete = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const result = await Swal.fire({
      icon: "warning",
      title: "Delete this address?",
      text: "This action cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#d81b60",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/address/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        router.push("/SignIn");
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Unable to delete address");
      }
      setAddresses((prev) => prev.filter((address) => address.id !== id));
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: error.message || "Could not delete address.",
        confirmButtonColor: "#d81b60",
      });
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/customerUserSignUp/users/${formData.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            companyName: formData.companyName,
            personName: formData.personName,
            Email: formData.Email,
            contactNumber: formData.contactNumber,
            status: formData.status,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update profile");
      }

      const updatedPayload = await response.json().catch(() => ({}));
      const updatedUser = {
        ...customerUser,
        ...(updatedPayload.user || updatedPayload),
        companyName: updatedPayload.user?.companyName || formData.companyName,
        personName: updatedPayload.user?.personName || formData.personName,
        Email: updatedPayload.user?.Email || formData.Email,
        contactNumber: updatedPayload.user?.contactNumber || formData.contactNumber,
        status: updatedPayload.user?.status || formData.status,
        id: formData.id,
      };

      localStorage.setItem("customerUser", JSON.stringify(updatedUser));
      setCustomerUser(updatedUser);
      setFormData(updatedUser);
      setIsEditing(false);
      window.dispatchEvent(new Event("storage"));

      Swal.fire({
        icon: "success",
        title: "Profile Updated!",
        text: "Your changes have been saved successfully",
        confirmButtonColor: "#d81b60",
      });
    } catch (error) {
      console.error("Profile update error:", error);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: error.message || "Could not update profile. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (passwordLoading) return;

    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      Swal.fire({
        icon: "warning",
        title: "Missing fields",
        text: "Please enter both old and new password.",
        confirmButtonColor: "#d81b60",
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/SignIn");
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword: passwordForm.oldPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update password");
      }

      setPasswordForm({ oldPassword: "", newPassword: "" });
      setShowPasswordForm(false);
      Swal.fire({
        icon: "success",
        title: "Password updated",
        text: "Your password has been changed successfully.",
        confirmButtonColor: "#d81b60",
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Update failed",
        text: error.message || "Could not update password.",
        confirmButtonColor: "#d81b60",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const passwordRules = useMemo(() => {
    const value = passwordForm.newPassword || "";
    const rules = [
      { id: "length", label: "At least 8 characters", ok: value.length >= 8 },
      { id: "upper", label: "One uppercase letter", ok: /[A-Z]/.test(value) },
      { id: "lower", label: "One lowercase letter", ok: /[a-z]/.test(value) },
      { id: "number", label: "One number", ok: /\d/.test(value) },
      { id: "symbol", label: "One special character", ok: /[^A-Za-z0-9]/.test(value) },
    ];
    const passed = rules.filter((rule) => rule.ok).length;
    const strengthLabel =
      passed <= 1 ? "Weak" : passed <= 3 ? "Medium" : "Strong";
    return { rules, passed, strengthLabel };
  }, [passwordForm.newPassword]);

  if (!customerUser) {
    return (
      <div className="profile-loading-shell">
        <Loader2 className="profile-loading-spinner" />
      </div>
    );
  }

  const profileFields = [
    { label: "Company Name", name: "companyName", icon: Building2, disabled: true },
    { label: "Contact Person", name: "personName", icon: UserRound },
    { label: "Email", name: "Email", icon: Mail },
    { label: "Contact Number", name: "contactNumber", icon: Phone },
    { label: "Status", name: "status", icon: ShoppingBag, disabled: true },
  ];

  const renderOrderHistory = () => (
    <section className="profile-card profile-orders-card">
      <div className="profile-card-header">
        <div>
          <p className="profile-section-label">Order History</p>
          <h3>Recent purchase orders</h3>
        </div>
      </div>

      <div className="profile-order-grid">
        {purchaseOrders.length > 0 ? (
          purchaseOrders.slice(0, 6).map((order) => (
            <article key={order.id} className="profile-order-item">
              <div className="profile-order-top">
                <span className="profile-order-badge">PO #{order.id}</span>
                <span className="profile-order-date">{formatDate(order.order_date)}</span>
              </div>
              <h4>{order.items?.[0]?.product_name || "Order item"}</h4>
              <p>
                Qty: {order.items?.[0]?.quantity || 1}
                {" | "}
                Total: Rs. {Number(order.total_amount || 0).toLocaleString("en-IN")}
              </p>
            </article>
          ))
        ) : (
          <div className="profile-empty-orders">
            No purchase orders yet. Items created from your cart will appear here.
          </div>
        )}
      </div>
    </section>
  );

  return (
    <>
      <Navbar disableFilters disableSearch />
      <div className="profile-page account-page">
        <div className="profile-shell account-shell">
          <Box className="account-content">
            <div className="profile-page-header">
              <button
                type="button"
                onClick={() => router.push("/customer/products")}
                className="profile-back-button"
              >
                <ArrowLeft size={18} />
                <span>Back to products</span>
              </button>
              <div>
                <p className="profile-section-label">My Account</p>
                <h1>Manage your profile, addresses, and orders.</h1>
              </div>
            </div>

            <div className="account-content-scroll">
              {activeSection === "personal" && (
                <>
                  <section className="profile-hero-card">
                    <div className="profile-avatar-block">
                      <img src="/User_Icon.jpg" alt="Profile" className="profile-avatar" />
                      <div>
                        <h2>{customerUser.personName}</h2>
                        <p>{customerUser.Email}</p>
                      </div>
                    </div>

                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="profile-primary-button"
                      >
                        <PencilLine size={16} />
                        <span>Edit Profile</span>
                      </button>
                    )}
                  </section>

                  <div className="profile-grid">
                    <section className="profile-card">
                      <div className="profile-card-header">
                        <div>
                          <p className="profile-section-label">User Info</p>
                          <h3>Personal information</h3>
                        </div>
                      </div>

                      {!isEditing ? (
                        <div className="profile-info-grid">
                          {profileFields.map(({ label, name, icon: Icon }) => (
                            <div key={name} className="profile-detail-item">
                              <div className="profile-detail-title">
                                <Icon size={16} />
                                <span>{label}</span>
                              </div>
                              <p>{customerUser[name] || "Not provided"}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <form onSubmit={handleSave} className="profile-form">
                          <div className="profile-form-grid">
                            {profileFields.map(({ label, name, icon: Icon, disabled }) => (
                              <label key={name} className="profile-field">
                                <span className="profile-field-label">
                                  <Icon size={16} />
                                  <span>{label}</span>
                                </span>
                                <input
                                  name={name}
                                  type={name === "Email" ? "email" : "text"}
                                  value={formData[name] || ""}
                                  onChange={handleChange}
                                  disabled={disabled}
                                  required
                                  className="profile-input"
                                />
                              </label>
                            ))}
                          </div>

                          <div className="profile-form-actions">
                            <button
                              type="button"
                              className="profile-secondary-button"
                              onClick={() => {
                                setFormData(customerUser);
                                setIsEditing(false);
                              }}
                              disabled={isLoading}
                            >
                              Cancel
                            </button>
                            <button type="submit" className="profile-primary-button" disabled={isLoading}>
                              {isLoading ? (
                                <>
                                  <Loader2 className="profile-inline-spinner" />
                                  <span>Saving...</span>
                                </>
                              ) : (
                                "Save Changes"
                              )}
                            </button>
                          </div>
                        </form>
                      )}
                    </section>

                    <section className="profile-card">
                      <div className="profile-card-header">
                        <div>
                          <p className="profile-section-label">Address</p>
                          <h3>Latest delivery details</h3>
                        </div>
                        <MapPin size={18} className="profile-muted-icon" />
                      </div>

                      <div className="profile-address-box">
                        <p>{addressSummary.address}</p>
                        <span>
                          {addressSummary.city}
                          {addressSummary.state ? `, ${addressSummary.state}` : ""}
                        </span>
                        <span>
                          {addressSummary.country}
                          {addressSummary.postalCode ? ` - ${addressSummary.postalCode}` : ""}
                        </span>
                      </div>
                    </section>
                  </div>
                </>
              )}

              {activeSection === "password" && (
                <section className="profile-card account-placeholder">
                  <div className="profile-card-header">
                    <div>
                      <p className="profile-section-label">Security</p>
                      <h3>Change password</h3>
                    </div>
                  </div>
                  <p className="account-placeholder-text">
                    Keep your account secure by updating your password regularly.
                  </p>
                  {!showPasswordForm ? (
                    <div className="account-placeholder-actions">
                      <button
                        type="button"
                        className="profile-primary-button"
                        onClick={() => setShowPasswordForm(true)}
                      >
                        Update Password
                      </button>
                    </div>
                  ) : (
                    <form className="profile-password-form" onSubmit={handlePasswordSubmit}>
                      <label className="profile-password-field">
                        <span>Old Password</span>
                        <div className="profile-password-input-wrap">
                          <input
                            type={showOldPassword ? "text" : "password"}
                            name="oldPassword"
                            value={passwordForm.oldPassword}
                            onChange={handlePasswordChange}
                            className="profile-password-input"
                            placeholder="Enter old password"
                            required
                          />
                          <button
                            type="button"
                            className="profile-password-toggle"
                            onClick={() => setShowOldPassword((prev) => !prev)}
                            aria-label={showOldPassword ? "Hide password" : "Show password"}
                          >
                            {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </label>
                      <label className="profile-password-field">
                        <span>New Password</span>
                        <div className="profile-password-input-wrap">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            name="newPassword"
                            value={passwordForm.newPassword}
                            onChange={handlePasswordChange}
                            className="profile-password-input"
                            placeholder="Enter new password"
                            required
                          />
                          <button
                            type="button"
                            className="profile-password-toggle"
                            onClick={() => setShowNewPassword((prev) => !prev)}
                            aria-label={showNewPassword ? "Hide password" : "Show password"}
                          >
                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </label>
                      <div className="profile-password-rules">
                        <div className="profile-password-strength">
                          <span>Strength:</span>
                          <strong
                            className={`profile-password-strength-value profile-password-strength-${passwordRules.strengthLabel.toLowerCase()}`}
                          >
                            {passwordRules.strengthLabel}
                          </strong>
                        </div>
                        <ul className="profile-password-rule-list">
                          {passwordRules.rules.map((rule) => (
                            <li
                              key={rule.id}
                              className={rule.ok ? "rule-pass" : "rule-pending"}
                            >
                              {rule.label}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="profile-password-actions">
                        <button
                          type="button"
                          className="profile-secondary-button"
                          onClick={() => {
                            setShowPasswordForm(false);
                            setPasswordForm({ oldPassword: "", newPassword: "" });
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="profile-primary-button"
                          disabled={passwordLoading}
                        >
                          {passwordLoading ? "Updating..." : "Save Password"}
                        </button>
                      </div>
                    </form>
                  )}
                </section>
              )}

              {activeSection === "addresses" && (
                <section className="profile-card">
                  <div className="profile-card-header">
                    <div>
                      <p className="profile-section-label">Addresses</p>
                      <h3>Manage delivery addresses</h3>
                    </div>
                  </div>
                  <div className="profile-address-layout">
                    <form className="profile-address-form" onSubmit={handleAddressSubmit}>
                      <div className="profile-address-form-head">
                        <div>
                          <h4>{editingAddressId ? "Edit address" : "Add new address"}</h4>
                          <p>Save a delivery address so checkout feels effortless.</p>
                        </div>
                        <span className="profile-address-chip">
                          {editingAddressId ? "Updating" : "New"}
                        </span>
                      </div>

                      <div className="profile-address-form-grid">
                        <label className="profile-address-field">
                          <span>Name</span>
                          <input
                            name="name"
                            value={addressForm.name}
                            onChange={handleAddressChange}
                            required
                            className="profile-address-input"
                            placeholder="Full name"
                          />
                        </label>
                        <label className="profile-address-field">
                          <span>Phone</span>
                          <input
                            name="phone"
                            value={addressForm.phone}
                            onChange={handleAddressChange}
                            required
                            className="profile-address-input"
                            placeholder="Phone number"
                          />
                        </label>
                        <label className="profile-address-field profile-address-field-full">
                          <span>Address line</span>
                          <textarea
                            name="address_line"
                            value={addressForm.address_line}
                            onChange={handleAddressChange}
                            required
                            className="profile-address-textarea"
                            placeholder="House number, street, area"
                          />
                        </label>
                        <label className="profile-address-field">
                          <span>City</span>
                          <input
                            name="city"
                            value={addressForm.city}
                            onChange={handleAddressChange}
                            required
                            className="profile-address-input"
                            placeholder="City"
                          />
                        </label>
                        <label className="profile-address-field">
                          <span>State</span>
                          <input
                            name="state"
                            value={addressForm.state}
                            onChange={handleAddressChange}
                            required
                            className="profile-address-input"
                            placeholder="State"
                          />
                        </label>
                        <label className="profile-address-field">
                          <span>Pincode</span>
                          <input
                            name="pincode"
                            value={addressForm.pincode}
                            onChange={handleAddressChange}
                            required
                            className="profile-address-input"
                            placeholder="Pincode"
                          />
                        </label>
                      </div>

                      <div className="profile-address-actions">
                        {editingAddressId && (
                          <button
                            type="button"
                            className="profile-address-action profile-address-action-ghost"
                            onClick={resetAddressForm}
                          >
                            Cancel
                          </button>
                        )}
                        <button type="submit" className="profile-address-action profile-address-action-primary">
                          {editingAddressId ? "Save changes" : "Add address"}
                        </button>
                      </div>
                    </form>

                    <div className="profile-address-list">
                      <div className="profile-address-list-head">
                        <div>
                          <h4>Saved addresses</h4>
                          <p>Keep at least one address on file for faster checkout.</p>
                        </div>
                        <span>{addresses.length}</span>
                      </div>

                      {addressLoading ? (
                        <div className="profile-address-empty">Loading addresses...</div>
                      ) : addresses.length > 0 ? (
                        <div className="profile-address-cards">
                          {addresses.map((address) => (
                            <article key={address.id} className="profile-address-card">
                              <div className="profile-address-card-top">
                                <div>
                                  <h5>{address.name}</h5>
                                  <p>{address.phone}</p>
                                </div>
                                <span className="profile-address-badge">#{address.id}</span>
                              </div>
                              <div className="profile-address-card-body">
                                <p>{address.address_line}</p>
                                <span>
                                  {address.city}, {address.state} - {address.pincode}
                                </span>
                              </div>
                              <div className="profile-address-card-actions">
                                <button
                                  type="button"
                                  className="profile-address-action profile-address-action-ghost"
                                  onClick={() => handleAddressEdit(address)}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="profile-address-action profile-address-action-danger"
                                  onClick={() => handleAddressDelete(address.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <div className="profile-address-empty">
                          No saved addresses yet. Add one to get started.
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {activeSection === "wishlist" && (
                <section className="profile-card account-placeholder">
                  <div className="profile-card-header">
                    <div>
                      <p className="profile-section-label">Wishlist</p>
                      <h3>Your saved picks</h3>
                    </div>
                  </div>
                  <p className="account-placeholder-text">
                    Your wishlist items will appear here once you start saving products.
                  </p>
                </section>
              )}

              {activeSection === "order-history" && renderOrderHistory()}

              {activeSection === "transactions" && (
                <section className="profile-card account-placeholder">
                  <div className="profile-card-header">
                    <div>
                      <p className="profile-section-label">Transactions</p>
                      <h3>Payment history</h3>
                    </div>
                  </div>
                  <p className="account-placeholder-text">
                    Transaction details will be shown here when available from the backend.
                  </p>
                </section>
              )}
            </div>
          </Box>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CustomerProfile;
