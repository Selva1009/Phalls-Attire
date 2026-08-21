"use client";
import { API_BASE_URL } from "@/lib/api";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

// Validation schema for OTP
const schema = yup.object().shape({
  otp: yup
    .string()
    .length(4, "OTP must be 4 digits long")
    .matches(/^\d+$/, "OTP must only contain numbers")
    .required("OTP is required"),
});

export default function ForgotPassOtp() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      otp: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const email = localStorage.getItem("userEmail");

      if (!email) {
        setErrorMessage("Email is missing. Please request a new OTP.");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/forgotpassword/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            otp: data.otp,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Invalid OTP");
      }

      const result = await response.json();
      setSuccessMessage(result.message || "OTP validated successfully.");
      router.push("/ResetPassword");
    } catch (error) {
      setErrorMessage(error.message || "Failed to validate OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full">
      {/* Right Side - OTP Form */ }
      <div className="w-full flex items-center justify-center bg-gray-100 px-6 py-10 2xl:py-16">
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
            <h2 className="text-2xl 2xl:text-3xl font-semibold text-gray-800 text-start">
              Forgot Password
            </h2>
            <p className="text-gray-600 mb-4 2xl:mb-6 text-sm 2xl:text-lg text-start">
              Please enter the 4-digit OTP sent to your email
            </p>

            <form
              onSubmit={ handleSubmit(onSubmit) }
              className="space-y-4 2xl:space-y-6"
            >
              <div className="flex justify-between space-x-3 2xl:space-x-4">
                { [...Array(4)].map((_, index) => (
                  <div key={ index } className="flex-1">
                    <Controller
                      name="otp"
                      control={ control }
                      render={ ({ field }) => (
                        <Input
                          { ...field }
                          maxLength={ 1 }
                          type="text"
                          className="w-full text-center border border-gray-300 rounded-md py-2 px-3 2xl:py-3 2xl:px-4 text-lg 2xl:text-xl"
                          placeholder="0"
                          onChange={ (e) => {
                            const value = e.target.value;
                            if (/^\d*$/.test(value)) {
                              const newOtp = field.value.split("");
                              newOtp[index] = value;
                              field.onChange(newOtp.join(""));
                              if (value && index < 3) {
                                const nextInput = document.querySelector(
                                  `input[name="otp-${index + 1}"]`
                                );
                                if (nextInput) nextInput.focus();
                              }
                            }
                          } }
                          value={ field.value[index] || "" }
                          name={ `otp-${index}` }
                        />
                      ) }
                    />
                  </div>
                )) }
              </div>

              { errors.otp && (
                <p className="text-red-500 text-xs 2xl:text-sm mt-1">
                  { errors.otp.message }
                </p>
              ) }
              { errorMessage && (
                <p className="text-red-500 text-xs 2xl:text-sm mt-2">
                  { errorMessage }
                </p>
              ) }
              { successMessage && (
                <p className="text-green-500 text-xs 2xl:text-sm mt-2">
                  { successMessage }
                </p>
              ) }

              <Button
                type="submit"
                disabled={ loading }
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 2xl:py-3 rounded-md disabled:bg-gray-400 flex items-center justify-center text-base 2xl:text-lg"
              >
                { loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 w-4 h-4 2xl:w-5 2xl:h-5" />
                    Verifying...
                  </>
                ) : (
                  "Submit"
                ) }
              </Button>
            </form>

            <Link
              href="/ForgotPassword"
              className="flex items-center text-gray-600 mt-4 2xl:mt-6 hover:text-gray-800 text-sm 2xl:text-base"
            >
              <ArrowLeft className="w-4 h-4 2xl:w-5 2xl:h-5 mr-2" />
              <span>Back</span>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

