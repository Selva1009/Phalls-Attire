import { API_BASE_URL } from "@/lib/api";
import { useState } from "react";
import Swal from "sweetalert2";

export const useOtp = () => {
  const [otpMessage, setOtpMessage] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpError, setOtpError] = useState("");

  const handleOtpRequest = async (email, endpoint) => {
    if (!email) {
      setOtpMessage("Email is required before requesting OTP.");
      return;
    }
    setLoading(true);
    setOtpError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/${endpoint}/${endpoint}-sendotp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const result = await response.json();
      if (response.ok) {
        setOtpSent(true);
        setOtpMessage("OTP sent successfully!");
        setLoading(false);
        setTimeout(() => {
          setOtpMessage("");
        }, 7000);
      } else {
        setOtpError(result.error || "Failed to send OTP");
      }
    } catch (error) {
      setOtpError("Error sending OTP. Try again.");
      setTimeout(() => {
        setOtpMessage("");
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  return { otpMessage, otpSent, setOtpError, otpError, loading, handleOtpRequest };
};
