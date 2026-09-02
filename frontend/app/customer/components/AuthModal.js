"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, X } from "lucide-react";
import Swal from "sweetalert2";
import { API_BASE_URL } from "@/lib/api";
import { showAuthSuccess } from "@/lib/authAlerts";
import {
  clearAuthRedirect,
  clearSignupSession,
  setSignupSession,
} from "@/lib/customerSession";
import styles from "./AuthModal.module.css";

export default function AuthModal({
  open,
  initialTab = "login",
  onClose,
  onLoginSuccess,
  onSignupSuccess,
}) {
  const router = useRouter();
  const [tab, setTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [usePhoneLogin, setUsePhoneLogin] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");

  const [signupValues, setSignupValues] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
  });
  const [signupErrors, setSignupErrors] = useState({});
  const [signupShowPassword, setSignupShowPassword] = useState(false);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
    }
  }, [initialTab, open]);

  if (!open) return null;

  const finalizeLogin = async (data) => {
    clearSignupSession();
    clearAuthRedirect();
    window.dispatchEvent(new Event("storage"));

    const result = await showAuthSuccess({
      title: "Login Successful!",
      text: "You are now logged in.",
    });

    if (result.isConfirmed) {
      if (data.userType === "SUPER_ADMIN") {
        router.push("/vendorUser/productcards");
        return;
      }
      onLoginSuccess?.(data);
    }
  };

  const handleLogin = async () => {
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

      if (data.userType === "SUPER_ADMIN") {
        localStorage.setItem("vendorUser", JSON.stringify(data.user));
        localStorage.setItem("vendorUserId", data.user.id.toString());
      } else if (data.userType === "customer-user") {
        localStorage.setItem("customerUser", JSON.stringify(data.user));
        localStorage.setItem("customerUserId", data.user.id.toString());
      }

      await finalizeLogin(data);
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
  };

  const handleSendOtp = async () => {
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
  };

  const handlePhoneLogin = async () => {
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

      if (data.userType === "SUPER_ADMIN") {
        localStorage.setItem("vendorUser", JSON.stringify(data.user));
        localStorage.setItem("vendorUserId", data.user.id.toString());
      } else if (data.userType === "customer-user") {
        localStorage.setItem("customerUser", JSON.stringify(data.user));
        localStorage.setItem("customerUserId", data.user.id.toString());
      }

      await finalizeLogin(data);
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
  };

  const handleSignupChange = (event) => {
    const { name, value } = event.target;
    setSignupValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!signupValues.name.trim()) nextErrors.name = "Name is required";
    if (!signupValues.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupValues.email)) {
      nextErrors.email = "Enter a valid email";
    }
    if (!signupValues.mobile.trim()) {
      nextErrors.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(signupValues.mobile)) {
      nextErrors.mobile = "Enter a valid 10-digit mobile number";
    }
    if (!signupValues.password.trim()) {
      nextErrors.password = "Password is required";
    } else if (signupValues.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }

    setSignupErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/customer/customer-signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName: "Individual",
            personName: signupValues.name.trim(),
            contactNumber: signupValues.mobile.trim(),
            Email: signupValues.email.trim(),
            password: signupValues.password,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Please try again later.");
      }

      const confirm = await showAuthSuccess({
        title: "Signup Successful!",
        text: "Your account is ready. Welcome to Phalls Attire.",
      });

      if (confirm.isConfirmed) {
        setSignupSession({
          name: signupValues.name.trim(),
          email: signupValues.email.trim(),
        });
        clearAuthRedirect();
        onSignupSuccess?.();
      }
    } catch (error) {
      Swal.fire({
        title: "Signup Failed",
        text: error.message || "Please try again later.",
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
  };

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.card} onClick={(event) => event.stopPropagation()}>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        <div className={styles.header}>
          <img src="/Logo.png" alt="Phalls Attire" className={styles.logo} />
          <h2 className={styles.title}>Continue with your account</h2>
          <p className={styles.subtitle}>
            Sign in to view premium edits or create a new account in seconds.
          </p>
        </div>

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tabButton} ${tab === "login" ? styles.tabActive : ""}`}
            onClick={() => setTab("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${tab === "signup" ? styles.tabActive : ""}`}
            onClick={() => setTab("signup")}
          >
            Sign Up
          </button>
        </div>

        {tab === "login" ? (
          <div className={styles.panel}>
            <div className={styles.switchRow}>
              <button
                type="button"
                className={`${styles.switchButton} ${!usePhoneLogin ? styles.switchActive : ""}`}
                onClick={() => setUsePhoneLogin(false)}
              >
                Email Login
              </button>
              <button
                type="button"
                className={`${styles.switchButton} ${usePhoneLogin ? styles.switchActive : ""}`}
                onClick={() => setUsePhoneLogin(true)}
              >
                Phone Number Login
              </button>
            </div>

            {!usePhoneLogin ? (
              <form
                className={styles.form}
                onSubmit={(event) => {
                  event.preventDefault();
                  handleLogin();
                }}
              >
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="auth-email">
                    Registered Email
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    className={styles.input}
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="auth-password">
                    Password
                  </label>
                  <div className={styles.passwordWrap}>
                    <input
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      className={styles.input}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      className={styles.eyeButton}
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className={styles.primaryButton} disabled={loading}>
                  {loading ? "Signing in..." : "Login to Continue"}
                </button>
              </form>
            ) : (
              <form
                className={styles.form}
                onSubmit={(event) => {
                  event.preventDefault();
                  handlePhoneLogin();
                }}
              >
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="auth-phone">
                    Phone Number
                  </label>
                  <input
                    id="auth-phone"
                    type="tel"
                    inputMode="numeric"
                    className={styles.input}
                    placeholder="Enter phone number"
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                  />
                </div>

                <div className={styles.otpRow}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="auth-otp">
                      OTP
                    </label>
                    <input
                      id="auth-otp"
                      type="text"
                      inputMode="numeric"
                      className={styles.input}
                      placeholder="Enter OTP"
                      value={otp}
                      onChange={(event) => setOtp(event.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className={`${styles.secondaryButton} ${styles.sendOtpButton}`}
                    onClick={handleSendOtp}
                    disabled={sendingOtp}
                  >
                    {sendingOtp ? "Sending OTP..." : "Send OTP"}
                  </button>
                </div>

                <div className={styles.otpActions}>
                  <button type="submit" className={styles.primaryButton} disabled={loading}>
                    {loading ? "Logging in..." : "Verify & Login"}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className={styles.panel}>
            <form className={styles.form} onSubmit={handleSignup}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="signup-name">
                  Full Name
                </label>
                <input
                  id="signup-name"
                  name="name"
                  type="text"
                  className={styles.input}
                  placeholder="Enter your name"
                  value={signupValues.name}
                  onChange={handleSignupChange}
                />
                {signupErrors.name && (
                  <span className={styles.errorText}>{signupErrors.name}</span>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="signup-email">
                  Email
                </label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  className={styles.input}
                  placeholder="Enter your email"
                  value={signupValues.email}
                  onChange={handleSignupChange}
                />
                {signupErrors.email && (
                  <span className={styles.errorText}>{signupErrors.email}</span>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="signup-mobile">
                  Mobile Number
                </label>
                <input
                  id="signup-mobile"
                  name="mobile"
                  type="tel"
                  inputMode="numeric"
                  className={styles.input}
                  placeholder="Enter your mobile number"
                  value={signupValues.mobile}
                  onChange={handleSignupChange}
                />
                {signupErrors.mobile && (
                  <span className={styles.errorText}>{signupErrors.mobile}</span>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="signup-password">
                  Password
                </label>
                <div className={styles.passwordWrap}>
                  <input
                    id="signup-password"
                    name="password"
                    type={signupShowPassword ? "text" : "password"}
                    className={styles.input}
                    placeholder="Create a password"
                    value={signupValues.password}
                    onChange={handleSignupChange}
                  />
                  <button
                    type="button"
                    className={styles.eyeButton}
                    onClick={() => setSignupShowPassword((prev) => !prev)}
                    aria-label={signupShowPassword ? "Hide password" : "Show password"}
                  >
                    {signupShowPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {signupErrors.password && (
                  <span className={styles.errorText}>{signupErrors.password}</span>
                )}
              </div>

              <button type="submit" className={styles.primaryButton} disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
