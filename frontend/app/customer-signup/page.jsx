"use client";
import { API_BASE_URL } from "@/lib/api";
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { showAuthSuccess } from "@/lib/authAlerts";

const CustomerSignup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const router = useRouter();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {};

    if (!formValues.name.trim()) nextErrors.name = "Name is required";
    if (!formValues.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
      nextErrors.email = "Enter a valid email";
    }
    if (!formValues.mobile.trim()) {
      nextErrors.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formValues.mobile)) {
      nextErrors.mobile = "Enter a valid 10-digit mobile number";
    }
    if (!formValues.password.trim()) {
      nextErrors.password = "Password is required";
    } else if (formValues.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/customer/customer-signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName: "Individual",
            personName: formValues.name.trim(),
            contactNumber: formValues.mobile.trim(),
            Email: formValues.email.trim(),
            password: formValues.password,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        const result = await showAuthSuccess({
          title: "Signup Successful!",
          text: "You have successfully signed up.",
        });
        if (result.isConfirmed) {
          router.push("./SignIn");
        }
      } else {
        Swal.fire({
          title: "Signup Failed",
          text: result.message || "Please try again later.",
          icon: "error",
          confirmButtonColor: "#E91E63",
          confirmButtonText: "Try Again",
          customClass: {
            popup: "swal-soft-popup",
            title: "swal-soft-title",
            htmlContainer: "swal-soft-text",
            confirmButton: "swal-soft-confirm",
          },
        });
      }
    } catch (error) {
      Swal.fire({
        title: "Error Occurred",
        text: error.message || "Something went wrong. Please try again.",
        icon: "error",
        confirmButtonColor: "#E91E63",
        confirmButtonText: "Close",
        customClass: {
          popup: "swal-soft-popup",
          title: "swal-soft-title",
          htmlContainer: "swal-soft-text",
          confirmButton: "swal-soft-confirm",
        },
      });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-pink-100 to-rose-200 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-3xl border border-white/70 bg-white/85 shadow-[0_30px_80px_rgba(172,63,108,0.2)] backdrop-blur-md">
        <div className="px-8 pt-10 pb-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-200 to-rose-200">
            <img src="/Logo.png" alt="M-Place Logo" className="h-10 w-10 object-contain" />
          </div>
          <h1 className="mt-5 text-3xl font-semibold text-[#3a2230]">Create your account</h1>
          <p className="mt-2 text-sm text-[#7a5a6a]">
            Join the customer marketplace with a fast, elegant signup.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[#4d3d47]" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formValues.name}
              onChange={handleInputChange}
              placeholder="Enter your name"
              maxLength={60}
              required
              className="w-full rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm text-[#3a2230] focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
            {errors.name && <p className="text-xs text-rose-600">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#4d3d47]" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formValues.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              maxLength={120}
              required
              className="w-full rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm text-[#3a2230] focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
            {errors.email && <p className="text-xs text-rose-600">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#4d3d47]" htmlFor="mobile">
              Mobile Number
            </label>
            <input
              id="mobile"
              name="mobile"
              type="tel"
              value={formValues.mobile}
              onChange={handleInputChange}
              placeholder="Enter your mobile number"
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              required
              className="w-full rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm text-[#3a2230] focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
            {errors.mobile && <p className="text-xs text-rose-600">{errors.mobile}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#4d3d47]" htmlFor="password">
              Password
            </label>
            <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formValues.password}
              onChange={handleInputChange}
              placeholder="Create a password"
              minLength={6}
              maxLength={64}
              required
              className="w-full rounded-xl border border-pink-200 bg-white px-4 py-3 pr-12 text-sm text-[#3a2230] focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a7a8b]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-rose-600">{errors.password}</p>}
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-200/60 transition hover:brightness-95"
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomerSignup;
