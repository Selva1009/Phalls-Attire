"use client";

import { API_BASE_URL } from "@/lib/api";
import { useState, useEffect } from "react";
import { FaClipboardList } from "react-icons/fa";
import {
  User,
  BellRing,
  Calendar,
  UserRoundPen,
  LogOut,
  X,
  ShoppingCart,
  PackagePlus,
  FileText,
  Menu,
  Link,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Swal from "sweetalert2";
import { showLogoutSuccess } from "@/lib/authAlerts";

export default function DashboardLayout({ id, children }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [vendorUser, setVendorUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fadeIn, setFadeIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [readNotifications, setReadNotifications] = useState(new Set());
  const [message, setMessage] = useState("");

  const router = useRouter();
  const pathname = usePathname();

  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  useEffect(() => {
    const storedVendorUser = localStorage.getItem("vendorUser");
    if (!storedVendorUser) {
      setError("Vendor user not found. Please sign in again.");
      router.replace("/SignIn");
      return;
    }

    try {
      const parsed = JSON.parse(storedVendorUser);
      setVendorUser(parsed);
    } catch (error) {
      setError("Invalid vendor user data. Please sign in again.");
      router.replace("/SignIn");
      return;
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!id) return;

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/notification/${id}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch notifications");
        }
        const data = await response.json();

        if (!data.notifications) {
          console.error("Backend returned no notifications");
          return;
        }

        const formattedNotifications = data.notifications
          .map((notif) => ({
            ...notif,
            read: notif.status === "read",
            time: new Date(notif.created_at).toLocaleString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              month: "short",
              day: "numeric",
              year: "numeric",
              timeZone: "Asia/Kolkata",
              hour12: true,
            }),
          }))
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setNotifications((prev) =>
          JSON.stringify(prev) === JSON.stringify(formattedNotifications)
            ? prev
            : formattedNotifications
        );
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "all") return true;
    return filter === "read" ? notif.read : !notif.read;
  });

  const markAsRead = async (notifId) => {
    if (!notifId) {
      console.error("Notification ID is missing");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notification/read/${notifId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notifId
              ? { ...notif, status: "read", read: true }
              : notif
          )
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Handle mark all as read
  const markAllAsRead = async () => {
    const storedVendorUser = localStorage.getItem("vendorUser");

    if (!storedVendorUser) {
      console.error("Vendor user not found in localStorage.");
      setMessage("Vendor user not found. Please log in again.");
      return;
    }

    const vendorUser = JSON.parse(storedVendorUser);
    const vendorId = vendorUser.id; // assuming the object has an 'id' field

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notification/read-all/${vendorId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message || "All notifications marked as read.");
        setNotifications((prevNotifications) =>
          prevNotifications.map((notification) => ({
            ...notification,
            status: "read",
            read: true, // optional, if you use this flag
          }))
        );
      } else {
        const errorData = await response.json();
        console.error("Failed to mark all as read:", errorData.message);
        setMessage(
          errorData.message || "Failed to mark notifications as read."
        );
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      setMessage("An error occurred while marking notifications as read.");
    }
  };

  useEffect(() => {
    setFadeIn(false);
    setTimeout(() => setFadeIn(true), 100);
  }, [pathname]);

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);
  const toggleNotification = () => {
    setNotificationOpen(!notificationOpen);
    document.body.style.overflow = notificationOpen ? "auto" : "hidden";
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    document.body.style.overflow = mobileMenuOpen ? "auto" : "hidden";
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Are you sure want to logout?",
      imageUrl: "/logout.gif",
      imageWidth: 127,
      imageHeight: 151,
      imageAlt: "Logout Image",
      showCancelButton: true,
      confirmButtonColor: "#3085D6",
      cancelButtonColor: "#3085D6",
      confirmButtonText: "<b>Yes</b>",
      cancelButtonText: "<b>Cancel</b>",
      customClass: {
        confirmButton: "swal-button",
        cancelButton: "swal-button",
        popup: "rounded-alert",
      },
    });

    if (result.isConfirmed) {
      localStorage.clear();
      await showLogoutSuccess("You have been signed out successfully.");
      router.push("/");
    }
  };

  useEffect(() => {
    const updateVendor = () => {
      const vendorData = localStorage.getItem("vendorUser");
      if (vendorData) {
        setVendorUser(JSON.parse(vendorData));
      }
    };

    window.addEventListener("storage", updateVendor);
    return () => {
      window.removeEventListener("storage", updateVendor);
    };
  }, []);

  return (
    <div className="flex flex-col h-20 min-h-screen bg-gray-100">
      {/* Desktop Header */}
      <div className="hidden sm:flex bg-white shadow px-6 py-2 justify-between items-center border-b fixed top-0 left-0 right-0 z-10">
        {/* Left Section - Logo and Navigation */}
        <div className="flex items-center space-x-6">
          {/* Logo */}
          <Link href="/vendorUser">
            <div className="cursor-pointer w-16 h-16 rounded-xl shadow-lg bg-gradient-to-br from-blue-600 to-indigo-500 p-1">
              <div className="w-full h-full bg-white rounded-xl flex items-center justify-center border border-gray-300 shadow-inner">
                <img
                  src="/Logo.png"
                  alt="Phalls Logo"
                  className="w-12 h-12 object-contain"
                />
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex space-x-6">
            <button
              onClick={() => router.push(`/vendorUser/productcards`)}
              className="text-[#374151] text-[14px] flex items-center gap-2 p-2 rounded-md hover:bg-blue-50 hover:text-blue-700 hover:border hover:border-blue-300 transition-colors"
            >
              <ShoppingCart size={18} /> Product Portal
            </button>

            <button
              onClick={() => router.push(`/vendorUser/addproducts`)}
              className="text-[#374151] text-[14px] flex items-center gap-2 p-2 rounded-md hover:bg-blue-50 hover:text-blue-700 hover:border hover:border-blue-300 transition-colors"
            >
              <PackagePlus size={18} /> Add Product
            </button>

            <button
              onClick={() => router.push(`/vendorUser/productdetails`)}
              className="text-[#374151] text-[14px] flex items-center gap-2 p-2 rounded-md hover:bg-blue-50 hover:text-blue-700 hover:border hover:border-blue-300 transition-colors"
            >
              <FileText size={18} /> Product Details
            </button>
            {/* <button
              onClick={() => router.push(`/vendorUser/PoTracking`)}
              className="text-[#374151] text-[14px] flex items-center gap-2 p-2 rounded-md hover:bg-blue-50 hover:text-blue-700 hover:border hover:border-blue-300 transition-colors"
            >
              <FileText size={18} /> Po Tracking
            </button> */}
          </nav>
        </div>

        {/* Right Section - Calendar, Notification, User Profile */}
        <div className="flex items-center space-x-6">
          {/* Date */}
          <div className="flex items-center">
            <Calendar className="text-black-900" />
            <span className="ml-2">{currentDate}</span>
          </div>
          <div className="w-[1px] h-10 bg-gray-200"></div>

          {/* Notifications */}
          <div className="relative">
            <button
              className="relative cursor-pointer"
              onClick={toggleNotification}
            >
              <BellRing className="text-black-900 mt-1 w-6 h-6" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {notifications.length}
                </span>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="w-[1px] h-10 bg-gray-200"></div>

          {/* User Dropdown */}
          <div
            className="relative flex items-center cursor-pointer"
            onClick={toggleDropdown}
          >
            <User size={32} className="text-black-900" />
            <div className="ml-2 text-[14px]">
              {loading && <span>Loading...</span>}
              {error && <span className="text-red-500">{error}</span>}
              {vendorUser && <span>{vendorUser.personName}</span>} <br />{" "}
              <span className="text-[12px] text-[#999999]">Vendor User</span>
            </div>
          </div>

          {dropdownOpen && (
            <div className="absolute right-[-38] top-[80px] w-56 bg-white shadow-xl rounded-xl z-50 border border-gray-200">
              <ul className="py-2 text-sm text-gray-700 font-medium">
                <li
                  onClick={() => {
                    router.push(`/vendorUser/myprofile`);
                    setDropdownOpen(false);
                  }}
                  className="px-4 py-3 hover:bg-gray-100 cursor-pointer flex items-center gap-3 transition-colors"
                >
                  <UserRoundPen className="text-gray-600" size={20} />
                  <span>My Profile</span>
                </li>
                <li
                  onClick={handleLogout}
                  className="px-4 py-3 hover:bg-red-50 text-red-600 cursor-pointer flex items-center gap-3 transition-colors"
                >
                  <LogOut className="text-red-500" size={20} />
                  <span>Logout</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Header */}
      <div className="sm:hidden fixed top-0 left-0 w-full h-16 bg-white border-b shadow-sm flex items-center justify-between px-4 z-50">
        {/* Left: Brand Name and Mobile Menu Button */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg shadow-md bg-gradient-to-br from-blue-600 to-indigo-500 p-1">
            <div className="w-full h-full bg-white rounded-lg flex items-center justify-center border border-gray-300 shadow-inner">
              <img
                src="/Logo.png"
                alt="M-Place Logo"
                className="w-7 h-7 object-contain"
              />
            </div>
          </div>
          <span className="font-medium text-sm">Vendor User</span>
        </div>

        {/* Right: Menu Button */}
        <button
          className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
          onClick={toggleMobileMenu}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 mt-16 backdrop-blur-sm"
            onClick={toggleMobileMenu}
          >
            <div
              className="absolute right-0 top-0 h-full w-72 bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Profile Info */}
              <div className="flex items-center gap-4 p-4 border-b">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <User size={24} className="text-gray-600" />
                </div>
                <div>
                  <p className="font-medium">
                    {vendorUser?.personName || "Vendor User"}
                  </p>
                  <p className="text-sm text-gray-500">Vendor User</p>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="p-4 space-y-2">
                <button
                  onClick={() => {
                    router.push(`/vendorUser/productcards`);
                    toggleMobileMenu();
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 w-full text-left"
                >
                  <ShoppingCart size={20} />
                  <span>Product Portal</span>
                </button>
                <button
                  onClick={() => {
                    router.push(`/vendorUser/addproducts`);
                    toggleMobileMenu();
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 w-full text-left"
                >
                  <PackagePlus size={20} />
                  <span>Add Product</span>
                </button>
                <button
                  onClick={() => {
                    router.push(`/vendorUser/productdetails`);
                    toggleMobileMenu();
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 w-full text-left"
                >
                  <FileText size={20} />
                  <span>Product Details</span>
                </button>
                {/* <button
                  onClick={() => {
                    router.push(`/vendorUser/PoTracking`);
                    toggleMobileMenu();
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 w-full text-left"
                >
                  <FileText size={20} />
                  <span>Po Tracking</span>
                </button> */}
              </div>

              {/* Bottom Section */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      router.push(`/vendorUser/myprofile`);
                      toggleMobileMenu();
                    }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 w-full text-left"
                  >
                    <UserRoundPen size={20} />
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      toggleMobileMenu();
                      handleLogout();
                    }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-red-100 text-red-600 w-full text-left"
                  >
                    <LogOut size={20} />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notification Sidebar */}
      {notificationOpen && (
        <div className="fixed top-0 right-0 w-full sm:w-[400px] h-full bg-white shadow-lg p-4 border-l z-50 overflow-y-auto transition-transform duration-300 ease-in-out transform translate-x-0">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Notifications</h2>
            <X
              size={24}
              className="cursor-pointer"
              onClick={toggleNotification}
            />
          </div>

          <hr className="mb-4" />

          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <select
                className="p-2 border rounded-md"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>
            <button
              className="bg-[#06436B] text-white p-2 rounded-md"
              onClick={markAllAsRead}
            >
              Mark all as read
            </button>
          </div>

          <hr className="mb-4" />

          {filteredNotifications.length === 0 ? (
            <p className="text-gray-500 text-center">No new notifications</p>
          ) : (
            <ul>
              {filteredNotifications.map((notif, index) => (
                <li
                  key={notif.id || index}
                  className={`p-3 mb-2 rounded-md cursor-pointer ${
                    notif.read
                      ? "bg-gray-100 text-gray-600"
                      : "bg-gray-300 text-black"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold">{notif.message}</p>
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    <div className="inline-block bg-[#EFF3F5] rounded-md">
                      {notif.time}
                    </div>
                  </div>
                  <div className="flex justify-between -mt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notif.id);
                      }}
                      className="text-blue-500 text-sm ml-[230px]"
                    >
                      Mark as Read
                    </button>
                  </div>
                  <hr className="my-2" />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Page Content */}
      <div
        className={`p-6 sm:p-8 bg-gray-50 flex-1 mt-16 sm:mt-20 transition-opacity duration-500 ${
          fadeIn ? "opacity-100" : "opacity-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
