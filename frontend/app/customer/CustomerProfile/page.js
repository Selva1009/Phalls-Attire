"use client";

import { API_BASE_URL } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  HelpCircle,
  LockKeyhole,
  LogOut,
  MapPin,
  Moon,
  Sun,
  Eye,
  EyeOff,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Swal from "sweetalert2";
import Footer from "@/app/LandingPage/Footer";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Switch,
  TextField,
} from "@mui/material";
import NeedHelpModal from "../../Components/NeedHelpModal";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/supportContact";

const THEME_KEY = "customerTheme";
const NOTIFICATIONS_KEY = "customerNotifications";

const CustomerProfile = () => {
  const [customerUser, setCustomerUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [activeAddressId, setActiveAddressId] = useState(null);
  const [showAllAddresses, setShowAllAddresses] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [themeMode, setThemeMode] = useState("light");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
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
  const searchParams = useSearchParams();
  const buildFormData = (user) => ({
    companyName: user?.companyName ?? "",
    personName: user?.personName ?? "",
    Email: user?.Email ?? "",
    contactNumber: user?.contactNumber ?? "",
    status: user?.status ?? "",
    id: user?.id ?? "",
  });

  useEffect(() => {
    const loadUserData = () => {
      const storedUser = localStorage.getItem("customerUser");
      if (!storedUser) {
        router.push("/Home");
        return;
      }

      try {
        const userData = JSON.parse(storedUser);
        setCustomerUser(userData);
        setFormData(buildFormData(userData));
      } catch (error) {
        console.error("Error parsing user data:", error);
        router.push("/Home");
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
    const storedTheme = localStorage.getItem(THEME_KEY) || "light";
    setThemeMode(storedTheme);
    applyTheme(storedTheme);

    const handleThemeEvent = () => {
      const fresh = localStorage.getItem(THEME_KEY) || "light";
      setThemeMode(fresh);
      applyTheme(fresh);
    };

    window.addEventListener("storage", handleThemeEvent);
    window.addEventListener("theme-change", handleThemeEvent);
    return () => {
      window.removeEventListener("storage", handleThemeEvent);
      window.removeEventListener("theme-change", handleThemeEvent);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    if (stored !== null) {
      setNotificationsEnabled(stored === "true");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("activeAddressId");
    if (stored) setActiveAddressId(Number(stored));
  }, []);

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
          router.push("/Home");
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

  const applyTheme = (mode) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark");
    root.classList.add(mode === "dark" ? "theme-dark" : "theme-light");
  };

  const handleThemeToggle = (event) => {
    const nextMode = event.target.checked ? "dark" : "light";
    setThemeMode(nextMode);
    localStorage.setItem(THEME_KEY, nextMode);
    applyTheme(nextMode);
    window.dispatchEvent(new Event("theme-change"));
  };

  const handleNotificationsToggle = (event) => {
    const nextValue = event.target.checked;
    setNotificationsEnabled(nextValue);
    localStorage.setItem(NOTIFICATIONS_KEY, nextValue ? "true" : "false");
  };

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
      router.push("/Home");
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
        router.push("/Home");
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
        router.push("/Home");
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

  const handleSelectAddress = (address) => {
    setActiveAddressId(address.id);
    if (typeof window !== "undefined") {
      localStorage.setItem("activeAddressId", String(address.id));
      localStorage.setItem("activeAddress", JSON.stringify(address));
      window.dispatchEvent(new Event("storage"));
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
      setFormData(buildFormData(updatedUser));
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
      router.push("/Home");
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
    const strengthLabel = passed <= 1 ? "Weak" : passed <= 3 ? "Medium" : "Strong";
    return { rules, passed, strengthLabel };
  }, [passwordForm.newPassword]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("customerUser");
    router.push("/Home");
  };

  const sectionMeta = {
    account: {
      title: "Account",
      subtitle: "View and update your profile details.",
    },
    addresses: {
      title: "Addresses",
      subtitle: "Manage your saved delivery addresses.",
    },
    security: {
      title: "Security",
      subtitle: "Change your password to keep your account safe.",
    },
    preferences: {
      title: "Preferences",
      subtitle: "Choose light or dark mode and manage notifications.",
    },
    support: {
      title: "Support",
      subtitle: "Tell us how we can help you.",
    },
    actions: {
      title: "Actions",
      subtitle: "Sign out of your account.",
    },
  };
  const sectionParam = searchParams.get("section");
  const activeSection = sectionMeta[sectionParam] ? sectionParam : "account";
  const headerHiddenSections = new Set(["addresses", "security", "preferences"]);
  const showHeader = !headerHiddenSections.has(activeSection);

  if (!customerUser) {
    return (
      <div className="profile-loading-shell">
        <div className="profile-loading-spinner" />
      </div>
    );
  }

  return (
    <>
      <Navbar disableFilters disableSearch hideCategories />
      <div className="settings-page">
        <Box className="settings-shell">
          {showHeader && (
            <header className="settings-header">
              <div>
                <p className="settings-eyebrow">Settings</p>
                <h1>{sectionMeta[activeSection].title}</h1>
                <p className="settings-subtitle">{sectionMeta[activeSection].subtitle}</p>
              </div>
            </header>
          )}

          <div className="settings-grid">
            {activeSection === "account" && (
              <section className="settings-account-grid">
                <div className="settings-identity-card">
                  <div className="settings-identity-top">
                    <div className="settings-profile-avatar">
                      <span>
                        {(customerUser.personName || "U")
                          .split(" ")
                          .map((chunk) => chunk[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div className="settings-identity-meta">
                      <p className="settings-identity-label">Profile summary</p>
                      <h2>{customerUser.personName || "Customer"}</h2>
                      <div className="settings-identity-lines">
                        <span>{customerUser.Email || "email@phalls.com"}</span>
                        <span>{customerUser.contactNumber || "Phone not added"}</span>
                      </div>
                      <div className="settings-identity-chips">
                        <span className="settings-status-chip">
                          {customerUser.status || "Active"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="settings-identity-actions">
                    <Button
                      type="button"
                      className="settings-primary"
                      onClick={() => {
                        if (isEditing) {
                          setFormData(buildFormData(customerUser));
                          setIsEditing(false);
                        } else {
                          setIsEditing(true);
                        }
                      }}
                    >
                      {isEditing ? "Cancel edit" : "Edit profile"}
                    </Button>
                  </div>
                  <p className="settings-identity-note">
                    {isEditing
                      ? "Editing enabled — remember to save your changes."
                      : "Click edit to update your details."}
                  </p>
                </div>

                <Card
                  className={`settings-card settings-edit-card ${
                    isEditing ? "is-editing" : ""
                  }`}
                >
                  <CardContent>
                    <div className="settings-edit-head">
                      <div>
                        <p className="settings-section-label">Account details</p>
                        <h3>Profile information</h3>
                        <p>Keep your contact information up-to-date.</p>
                      </div>
                      <span
                        className={`settings-edit-chip ${
                          isEditing ? "is-active" : ""
                        }`}
                      >
                        {isEditing ? "Editing" : "Read-only"}
                      </span>
                    </div>
                    {!isEditing && (
                      <div className="settings-edit-hint">
                        Switch to edit mode to update your details.
                      </div>
                    )}
                    <form className="settings-form settings-form-grid" onSubmit={handleSave}>
                      <TextField
                        label="Company name"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        fullWidth
                        disabled={!isEditing}
                        className="settings-input settings-span-full"
                      />
                      <TextField
                        label="Contact person"
                        name="personName"
                        value={formData.personName}
                        onChange={handleChange}
                        fullWidth
                        disabled={!isEditing}
                        className="settings-input"
                      />
                      <TextField
                        label="Email"
                        name="Email"
                        type="email"
                        value={formData.Email}
                        onChange={handleChange}
                        fullWidth
                        disabled={!isEditing}
                        className="settings-input"
                      />
                      <TextField
                        label="Phone number"
                        name="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleChange}
                        fullWidth
                        disabled={!isEditing}
                        className="settings-input"
                      />
                      <TextField
                        label="Status"
                        name="status"
                        value={formData.status}
                        fullWidth
                        disabled
                        className="settings-input settings-span-full"
                      />
                      {isEditing ? (
                        <div className="settings-actions settings-span-full">
                          <Button
                            type="button"
                            className="settings-secondary"
                            onClick={() => {
                              setFormData(buildFormData(customerUser));
                              setIsEditing(false);
                            }}
                            disabled={isLoading}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            className="settings-primary"
                            disabled={isLoading}
                          >
                            {isLoading ? "Saving..." : "Save changes"}
                          </Button>
                        </div>
                      ) : null}
                    </form>
                  </CardContent>
                </Card>
              </section>
            )}

            {activeSection === "addresses" && (
              <Card className="settings-card">
                <CardContent>
                  <div className="settings-card-head">
                    <div>
                      <p className="settings-section-label">Address settings</p>
                      <h3>Saved addresses</h3>
                      <p>Add, edit, or set a default delivery address.</p>
                    </div>
                    <MapPin size={18} />
                  </div>

                  <form className="settings-address-form" onSubmit={handleAddressSubmit}>
                    <TextField
                      label="Name"
                      name="name"
                      value={addressForm.name}
                      onChange={handleAddressChange}
                      fullWidth
                      className="settings-input"
                      required
                    />
                    <TextField
                      label="Phone"
                      name="phone"
                      value={addressForm.phone}
                      onChange={handleAddressChange}
                      fullWidth
                      className="settings-input"
                      required
                    />
                    <TextField
                      label="Address line"
                      name="address_line"
                      value={addressForm.address_line}
                      onChange={handleAddressChange}
                      fullWidth
                      multiline
                      minRows={2}
                      className="settings-input"
                      required
                    />
                    <div className="settings-address-row">
                      <TextField
                        label="City"
                        name="city"
                        value={addressForm.city}
                        onChange={handleAddressChange}
                        fullWidth
                        className="settings-input"
                        required
                      />
                      <TextField
                        label="State"
                        name="state"
                        value={addressForm.state}
                        onChange={handleAddressChange}
                        fullWidth
                        className="settings-input"
                        required
                      />
                      <TextField
                        label="Pincode"
                        name="pincode"
                        value={addressForm.pincode}
                        onChange={handleAddressChange}
                        fullWidth
                        className="settings-input"
                        required
                      />
                    </div>
                    <div className="settings-actions">
                      {editingAddressId ? (
                        <Button
                          type="button"
                          className="settings-secondary"
                          onClick={resetAddressForm}
                        >
                          Cancel
                        </Button>
                      ) : null}
                      <Button type="submit" className="settings-primary">
                        {editingAddressId ? "Save changes" : "Add address"}
                      </Button>
                    </div>
                  </form>

                  <Divider className="settings-divider" />

                  {addressLoading ? (
                    <p className="settings-muted">Loading addresses...</p>
                  ) : (
                    <div className="settings-address-list">
                      {(showAllAddresses ? addresses : addresses.slice(0, 2)).map((address) => (
                        <Card
                          key={address.id}
                          className={`settings-address-card ${
                            activeAddressId === address.id ? "is-active" : ""
                          }`}
                          onClick={() => handleSelectAddress(address)}
                        >
                          <CardContent>
                            <div className="settings-address-head">
                              <div>
                                <h4>{address.name}</h4>
                                <span>{address.phone}</span>
                              </div>
                              <BadgeCheck size={18} />
                            </div>
                            <p>{address.address_line}</p>
                            <span>
                              {address.city}, {address.state} - {address.pincode}
                            </span>
                            <div className="settings-actions">
                              <Button
                                type="button"
                                className="settings-secondary"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleAddressEdit(address);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                type="button"
                                className="settings-danger"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleAddressDelete(address.id);
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {addresses.length > 2 ? (
                        <Button
                          type="button"
                          className="settings-ghost"
                          onClick={() => setShowAllAddresses((prev) => !prev)}
                        >
                          {showAllAddresses ? "Show less" : "Show more"}
                        </Button>
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeSection === "security" && (
              <Card className="settings-card">
                <CardContent>
                  <div className="settings-card-head">
                    <div>
                      <p className="settings-section-label">Security settings</p>
                      <h3>Change password</h3>
                      <p>Use a strong password to protect your account.</p>
                    </div>
                    <LockKeyhole size={18} />
                  </div>
                  <form className="settings-password" onSubmit={handlePasswordSubmit}>
                    <div className="settings-password-field">
                      <TextField
                        label="Old password"
                        name="oldPassword"
                        type={showOldPassword ? "text" : "password"}
                        value={passwordForm.oldPassword}
                        onChange={handlePasswordChange}
                        fullWidth
                        className="settings-input"
                        required
                      />
                      <button
                        type="button"
                        className="settings-visibility"
                        onClick={() => setShowOldPassword((prev) => !prev)}
                        aria-label={showOldPassword ? "Hide password" : "Show password"}
                      >
                        {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className="settings-password-field">
                      <TextField
                        label="New password"
                        name="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        fullWidth
                        className="settings-input"
                        required
                      />
                      <button
                        type="button"
                        className="settings-visibility"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className="settings-password-rules">
                      <div>
                        <p>
                          Strength: <strong>{passwordRules.strengthLabel}</strong>
                        </p>
                        <ul>
                          {passwordRules.rules.map((rule) => (
                            <li key={rule.id} className={rule.ok ? "pass" : "pending"}>
                              {rule.label}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="settings-actions">
                      <Button
                        type="submit"
                        className="settings-primary"
                        disabled={passwordLoading}
                      >
                        {passwordLoading ? "Updating..." : "Save password"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {activeSection === "preferences" && (
              <Card className="settings-card">
                <CardContent>
                  <div className="settings-card-head">
                    <div>
                      <p className="settings-section-label">Notification settings</p>
                      <h3>Show notifications</h3>
                      <p>Control if we send you updates.</p>
                    </div>
                    <Bell size={18} />
                  </div>
                  <div className="settings-toggle-list">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notificationsEnabled}
                          onChange={handleNotificationsToggle}
                        />
                      }
                      label="Show notifications"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "preferences" && (
              <Card className="settings-card">
                <CardContent>
                  <div className="settings-card-head">
                    <div>
                      <p className="settings-section-label">Theme settings</p>
                      <h3>Light / Dark mode</h3>
                      <p>Switch between light and dark mode.</p>
                    </div>
                    {themeMode === "dark" ? <Moon size={18} /> : <Sun size={18} />}
                  </div>
                  <FormControlLabel
                    className="settings-theme-toggle"
                    control={<Switch checked={themeMode === "dark"} onChange={handleThemeToggle} />}
                    label={themeMode === "dark" ? "Dark mode" : "Light mode"}
                  />
                </CardContent>
              </Card>
            )}

            {activeSection === "support" && (
              <Card className="settings-card">
                <CardContent>
                  <div className="settings-card-head">
                    <div>
                      <p className="settings-section-label">Support</p>
                      <h3>Need help?</h3>
                      <p>Use the support form and we will assist you.</p>
                    </div>
                    <HelpCircle size={18} />
                  </div>
                  <div className="settings-row-list">
                    <div className="settings-row-item">
                      <div>
                        <h4>Contact support</h4>
                        <p>Tell us what you need help with.</p>
                      </div>
                      <Button
                        type="button"
                        className="settings-primary"
                        onClick={() => setShowHelp(true)}
                      >
                        Need help
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === "actions" && (
              <Card className="settings-card">
                <CardContent>
                  <div className="settings-card-head">
                    <div>
                      <p className="settings-section-label">Actions</p>
                      <h3>Log out</h3>
                      <p>Sign out of your account on this device.</p>
                    </div>
                    <LogOut size={18} />
                  </div>
                  <div className="settings-row-list">
                    <div className="settings-row-item">
                      <div>
                        <h4>Logout</h4>
                        <p>You can sign in again anytime.</p>
                      </div>
                      <Button type="button" className="settings-danger" onClick={handleLogout}>
                        Logout
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </Box>
      </div>
      <NeedHelpModal
        open={showHelp}
        onClose={() => setShowHelp(false)}
        title="Account support"
        description="Tell us what you need help with and our team will assist you."
        email={SUPPORT_EMAIL}
        phone={SUPPORT_PHONE}
        orderNumber={null}
      />
      <Footer />
    </>
  );
};

export default CustomerProfile;

