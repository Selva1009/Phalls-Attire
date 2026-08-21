"use client";
import { API_BASE_URL } from "@/lib/api";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { yupResolver } from "@hookform/resolvers/yup";
import ImageSlider from "../SignIn/ImageSlider";
import * as yup from "yup";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

// Define validation schema using Yup
const schema = yup.object().shape({
  email: yup
    .string()
    .email("Please enter a valid email address")
    .required("Email is required"),
});

export default function ForgotPassword() {
  const [otpMessage, setOtpMessage] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/forgotpassword/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setOtpMessage(errorData.error || errorData.message || "Unknown error.");
        return;
      }

      const result = await response.json();
      if (result.success) {
        setOtpSent(true);
        setOtpMessage("OTP sent successfully!");
        localStorage.setItem("userEmail", data.email);
        router.push("./ForgotPassOtp");
      } else {
        setOtpMessage(result.message || "Failed to send OTP");
      }
    } catch (error) {
      setOtpMessage("Error sending OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full">
      {/* Left Side - Image Slider (hidden on mobile) */ }
      <div className="hidden lg:block lg:w-1/2 h-full overflow-hidden">
        <ImageSlider />
      </div>

      {/* Forgot Password - Consistent Design with Login */ }
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-100 px-6 py-10 2xl:py-16">
        <Card className="w-full max-w-md 2xl:max-w-lg shadow-lg p-6 2xl:p-8 bg-white rounded-lg">
          <CardHeader>
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 2xl:w-24 2xl:h-24 rounded-xl shadow-lg bg-gradient-to-br from-blue-600 to-indigo-500 p-1">
              <div className="w-full h-full bg-white rounded-xl flex items-center justify-center border border-gray-300 shadow-inner">
                <img
                  src="/Logo.png"
                  alt="M-Place Logo"
                  className="w-12 h-12 sm:w-16 sm:h-16 2xl:w-20 2xl:h-20 object-contain"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <h2 className="text-2xl 2xl:text-3xl font-semibold text-gray-800 text-left">
              Forgot Password
            </h2>
            <p className="text-gray-600 mb-4 2xl:mb-6 2xl:text-lg text-left">
              Please enter your registered email ID to receive an OTP.
            </p>

            <form
              onSubmit={ handleSubmit(onSubmit) }
              className="space-y-4 2xl:space-y-6"
            >
              <div>
                <label
                  htmlFor="email"
                  className="text-sm 2xl:text-base text-gray-700"
                >
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  { ...register("email") }
                  className="2xl:h-12 2xl:text-base"
                />
                { errors.email && (
                  <p className="text-red-500 text-sm 2xl:text-base mt-1">
                    { errors.email.message }
                  </p>
                ) }
              </div>

              <Button
                type="submit"
                disabled={ loading }
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 2xl:py-3 rounded-md disabled:bg-gray-400 flex items-center justify-center text-base 2xl:text-lg"
              >
                { loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 w-5 h-5 2xl:w-6 2xl:h-6" />
                    Sending...
                  </>
                ) : (
                  "Submit"
                ) }
              </Button>
            </form>

            { otpMessage && (
              <p
                className={ `mt-3 2xl:mt-4 text-sm 2xl:text-base text-left ${otpSent ? "text-green-500" : "text-red-500"
                  }` }
              >
                { otpMessage }
              </p>
            ) }

            <Link
              href="/Home"
              className="flex items-center text-gray-600 mt-4 2xl:mt-6 hover:text-gray-800 text-sm 2xl:text-base"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Sign In
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

