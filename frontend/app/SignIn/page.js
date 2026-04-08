"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Swal from "sweetalert2";
import { showAuthSuccess } from "@/lib/authAlerts";
import { clearSignupSession, consumeAuthRedirect } from "@/lib/customerSession";

const signInSlides = [
  "/choose-your-style.png",
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [usePhoneLogin, setUsePhoneLogin] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const router = useRouter();

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    window.onpopstate = function () {
      window.history.pushState(null, "", window.location.href);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % signInSlides.length);
    }, 3200);

    return () => window.clearInterval(interval);
  }, []);

  const handleLogin = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Invalid email or password. Please try again."
            : data.message || "Login failed. Please try again."
        );
      }

      localStorage.setItem("token", data.token);

      localStorage.setItem("userType", data.userType);
      localStorage.setItem("userId", data.user.id.toString());

      const result = await showAuthSuccess({
        title: "Login Successful!",
        text: "You are now logged in.",
      });
     console.log(data,'login');
     
      if (result.isConfirmed) {
        clearSignupSession();
        if (data.userType === "vendor-user") {
          localStorage.setItem("vendorUser", JSON.stringify(data.user));
          localStorage.setItem("vendorUserId", data.user.id.toString());
          router.push(`/vendorUser`);
        } else if (data.userType === "customer-user") {
          const redirectPath = consumeAuthRedirect();
          localStorage.setItem("customerUser", JSON.stringify(data.user));
          localStorage.setItem("customerUserId", data.user.id.toString());
          router.push(redirectPath || "/customer/products");
        } else {
          Swal.fire("Unknown User Type", "Please contact support.", "warning");
        }
      }
    } catch (err) {
      Swal.fire({
        title: "Login Failed!",
        text: err.message,
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
    } finally {
      setLoading(false);
    }
  }, [email, password, rememberMe, router]);

  const handleSendOtp = useCallback(async () => {
    if (!phoneNumber) {
      Swal.fire({
        title: "Phone number required",
        text: "Please enter your phone number to receive an OTP.",
        icon: "warning",
        confirmButtonColor: "#E91E63",
      });
      return;
    }

    setSendingOtp(true);
    try {
      const response = await fetch("/api/auth/phone-sendotp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP. Please try again.");
      }

      Swal.fire({
        title: "OTP Sent!",
        text: data.message || "OTP sent successfully.",
        icon: "success",
        confirmButtonColor: "#E91E63",
      });
    } catch (err) {
      Swal.fire({
        title: "OTP Failed",
        text: err.message,
        icon: "error",
        confirmButtonColor: "#E91E63",
      });
    } finally {
      setSendingOtp(false);
    }
  }, [phoneNumber]);

  const handlePhoneLogin = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed. Please try again.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("userType", data.userType);
      localStorage.setItem("userId", data.user.id.toString());

      const result = await showAuthSuccess({
        title: "Login Successful!",
        text: "You are now logged in.",
      });

      if (result.isConfirmed) {
        clearSignupSession();
        if (data.userType === "vendor-user") {
          localStorage.setItem("vendorUser", JSON.stringify(data.user));
          localStorage.setItem("vendorUserId", data.user.id.toString());
          router.push(`/vendorUser`);
        } else if (data.userType === "customer-user") {
          const redirectPath = consumeAuthRedirect();
          localStorage.setItem("customerUser", JSON.stringify(data.user));
          localStorage.setItem("customerUserId", data.user.id.toString());
          router.push(redirectPath || "/customer/products");
        } else {
          Swal.fire("Unknown User Type", "Please contact support.", "warning");
        }
      }
    } catch (err) {
      Swal.fire({
        title: "Login Failed!",
        text: err.message,
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
    } finally {
      setLoading(false);
    }
  }, [otp, phoneNumber, router]);

  return (
    <div className="signin-container">
      <section className="signin-left">
        <div className="signin-left-slides">
          {signInSlides.map((slide, index) => (
            <img
              key={slide}
              src={slide}
              alt={`Fashion editorial ${index + 1}`}
              className={`signin-left-image ${index === activeSlide ? "signin-left-image-active" : ""}`}
            />
          ))}
        </div>
        <div className="signin-left-overlay" />
        <div className="signin-left-content">
          <h1>Luxury Dressing, Refined.</h1>
          <p>Discover premium silhouettes, occasion edits, and elevated essentials.</p>
        </div>
        <div className="signin-left-dots">
          {signInSlides.map((slide, index) => (
            <button
              key={`${slide}-dot`}
              type="button"
              aria-label={`Show slide ${index + 1}`}
              className={`signin-left-dot ${index === activeSlide ? "signin-left-dot-active" : ""}`}
              onClick={() => setActiveSlide(index)}
            />
          ))}
        </div>
      </section>

      <section className="signin-right">
        <div className="signin-card">
          <div className="signin-card-top">
            <div className="signin-logo-shell">
              <img src="/Logo.png" alt="M-Place Logo" className="signin-logo" />
            </div>
            <h2>Welcome Back</h2>
            <p>Sign in to continue</p>
          </div>

          <div className="signin-toggle">
            <button
              type="button"
              className={`signin-toggle-btn ${!usePhoneLogin ? "signin-toggle-btn-active" : ""}`}
              onClick={() => setUsePhoneLogin(false)}
            >
              Login with Email
            </button>
            <button
              type="button"
              className={`signin-toggle-btn ${usePhoneLogin ? "signin-toggle-btn-active" : ""}`}
              onClick={() => setUsePhoneLogin(true)}
            >
              Login with Phone Number
            </button>
          </div>

          {!usePhoneLogin ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handleLogin();
              }}
              className="signin-form"
            >
              <div className="signin-field">
                <label htmlFor="email">Registered Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="signin-field">
                <label htmlFor="password">Password</label>
                <div className="signin-password-wrap">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                  />
                  <button
                    type="button"
                    className="signin-eye-button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="signin-options">
                <label className="signin-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                  />
                  <span>Remember Me</span>
                </label>
                <Link href="../ForgotPassword" className="signin-link">
                  Forgot Password?
                </Link>
              </div>

              <button type="submit" disabled={loading} className="signin-btn">
                Login with Email
              </button>
            </form>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                handlePhoneLogin();
              }}
              className="signin-form"
            >
              <div className="signin-field">
                <label htmlFor="phoneNumber">Registered Phone Number</label>
                <input
                  id="phoneNumber"
                  type="tel"
                  inputMode="numeric"
                  placeholder="Enter registered phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="signin-field">
                <label htmlFor="otp">OTP</label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="signin-phone-actions">
                <button
                  type="button"
                  className="signin-btn signin-btn-secondary"
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                >
                  {sendingOtp ? "Sending OTP..." : "Send OTP"}
                </button>
                <button type="submit" disabled={loading} className="signin-btn">
                  Login with Phone Number
                </button>
              </div>
            </form>
          )}

          <div className="signin-divider">
            <span />
            <p>OR</p>
            <span />
          </div>
          <p className="signin-bottom-text">
            New here?{" "}
            <Link href="/LandingPage" className="signin-link">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
