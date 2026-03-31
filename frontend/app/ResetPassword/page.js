"use client";
import { API_BASE_URL } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import ImageSlider from "../SignIn/ImageSlider";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Swal from "sweetalert2";
import { Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

// Validation schema
const schema = yup.object().shape({
  newPassword: yup
    .string()
    .matches(
      /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\d).{8,}$/,
      "Password must have at least 1 uppercase letter, 1 special character, and 1 number"
    )
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("newPassword"), null], "Passwords must match")
    .required("Confirm password is required"),
});

export default function ResetPassword() {
  const router = useRouter();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const toggleNewPasswordVisibility = () =>
    setShowNewPassword(!showNewPassword);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword(!showConfirmPassword);

  const onSubmit = async (data) => {
    setLoading(true);
    const email = localStorage.getItem("userEmail");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/forgotpassword/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email,
            newPassword: data.newPassword,
            confirmPassword: data.confirmPassword,
          }),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to reset password");
      }

      Swal.fire({
        title: "Password Reset Successful!",
        text: "You can now log in with your new password.",
        icon: "success",
        confirmButtonColor: "#4BB543",
        confirmButtonText: "Go to Signin",
      }).then((result) => {
        if (result.isConfirmed) {
          router.push("/SignIn");
        }
      });
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: error.message || "Something went wrong. Please try again.",
        icon: "error",
        confirmButtonColor: "#D9534F",
        confirmButtonText: "Try Again",
      });
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

      {/* Right Side - Reset Password Form */ }
      {/* Right Side - Reset Password Form */ }
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
            <h2 className="text-2xl 2xl:text-3xl font-semibold text-gray-800">
              Reset Your Password
            </h2>
            <p className="text-gray-600 mb-4 2xl:mb-6 2xl:text-lg">
              Create a new secure password
            </p>

            <form
              onSubmit={ handleSubmit(onSubmit) }
              className="space-y-4 2xl:space-y-6"
            >
              {/* New Password */ }
              <div>
                <label
                  htmlFor="newPassword"
                  className="text-sm 2xl:text-base text-gray-700"
                >
                  New Password
                </label>
                <div className="relative mt-1">
                  <Input
                    id="newPassword"
                    type={ showNewPassword ? "text" : "password" }
                    placeholder="Enter new password"
                    { ...register("newPassword") }
                    className="2xl:h-12 2xl:text-base"
                  />
                  <button
                    type="button"
                    onClick={ toggleNewPasswordVisibility }
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    { showNewPassword ? (
                      <EyeOff size={ 20 } className="2xl:w-6 2xl:h-6" />
                    ) : (
                      <Eye size={ 20 } className="2xl:w-6 2xl:h-6" />
                    ) }
                  </button>
                </div>
                { errors.newPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    { errors.newPassword.message }
                  </p>
                ) }
              </div>

              {/* Confirm Password */ }
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="text-sm 2xl:text-base text-gray-700"
                >
                  Confirm Password
                </label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={ showConfirmPassword ? "text" : "password" }
                    placeholder="Confirm new password"
                    { ...register("confirmPassword") }
                    className="2xl:h-12 2xl:text-base"
                  />
                  <button
                    type="button"
                    onClick={ toggleConfirmPasswordVisibility }
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    { showConfirmPassword ? (
                      <EyeOff size={ 20 } className="2xl:w-6 2xl:h-6" />
                    ) : (
                      <Eye size={ 20 } className="2xl:w-6 2xl:h-6" />
                    ) }
                  </button>
                </div>
                { errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    { errors.confirmPassword.message }
                  </p>
                ) }
              </div>

              {/* Reset Button */ }
              <Button
                type="submit"
                disabled={ loading }
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 2xl:py-3 rounded-md disabled:bg-gray-400 flex items-center justify-center text-base 2xl:text-lg"
              >
                { loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={ 20 } />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
                ) }
              </Button>
            </form>

            {/* Back to Sign In */ }
            <div className="mt-4 2xl:mt-6 text-sm 2xl:text-base">
              <Link
                href="/SignIn"
                className="text-blue-500 hover:text-blue-700 flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to SignIn
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
