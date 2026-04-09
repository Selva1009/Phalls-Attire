"use client";
import { API_BASE_URL } from "@/lib/api";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookUser, Building, MapPinned, RectangleEllipsis } from "lucide-react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { showAuthSuccess } from "@/lib/authAlerts";
import { useCountriesStatesCities } from "../hooks/useCountriesStatesCities";
import { useFormValidation } from "../hooks/useFormValidation";
import { useOtp } from "../hooks/useOtp";
import { FormHeader } from "../Components/auth/FormHeader";
import { Section } from "../Components/auth/Section";
import { BusinessInfoSection } from "../Components/auth/BusinessInfoSection";
import { ContactDetailsSection } from "../Components/auth/ContactDetailsSection";
import { AddressSection } from "../Components/auth/AddressSection";
import { PasswordSection } from "../Components/auth/PasswordSection";
import { TermsCheckbox } from "../Components/auth/TermsCheckbox";

const VendorSignup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formValues, setFormValues] = useState({
    companyName: "",
    registrationNumber: "",
    companyWebsite: "",
    gstNumber: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
    otp: "",
    address: "",
    country: "",
    state: "",
    city: "",
    postalCode: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const [errors, setErrors] = useState({});
  const router = useRouter();
  const { countries, states, cities, fetchStates, fetchCities } =
    useCountriesStatesCities(formValues.country, formValues.state);
  const { validateForm } = useFormValidation();
  const {
    otpMessage,
    otpSent,
    loading,
    otpError,
    setOtpError,
    handleOtpRequest,
  } = useOtp();
  // Fetch states when country changes
  useEffect(() => {
    if (formValues.country) {
      fetchStates();
      handleInputChange({ target: { name: "state", value: "" } });
      handleInputChange({ target: { name: "city", value: "" } });
    }
  }, [formValues.country, fetchStates]);

  // Fetch cities when state changes
  useEffect(() => {
    if (formValues.state) {
      fetchCities();
      handleInputChange({ target: { name: "city", value: "" } });
    }
  }, [formValues.state, fetchCities]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormValues({
      ...formValues,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { isValid, errors: validationErrors } = validateForm(
      formValues,
      true
    );
    setErrors(validationErrors);

    if (!isValid) {
      console.log("Validation errors:", validationErrors);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/vendor/vendor-signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formValues),
        }
      );

      const result = await response.json();

      if (response.ok) {
        const result = await showAuthSuccess({
          title: "Signup Successful!",
          text: "You have successfully signed up as a vendor.",
          confirmButtonText: "Okay",
        });
        if (result.isConfirmed) {
          router.push("./Home");
        }
      } else {
        Swal.fire({
          title: "Signup Failed",
          text: result.message || "Please try again later.",
          icon: "error",
          confirmButtonColor: "#D9534F",
          confirmButtonText: "Try Again",
        });
      }
    } catch (error) {
      Swal.fire({
        title: "Error Occurred",
        text: error.message || "Something went wrong. Please try again.",
        icon: "error",
        confirmButtonColor: "#D9534F",
        confirmButtonText: "Close",
      });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div>
      <FormHeader
        title="Vendor Onboarding"
        description="Register today and gain access to a marketplace of trusted buyers."
      />

      <div className="w-full min-h-screen flex flex-col items-center justify-center pt-10 px-4 md:px-12 bg-gray-50">
        <div className="w-full relative bottom-6 mt-5 md:w-2/3 p-6 bg-white shadow-lg rounded-lg">
          <form onSubmit={ handleSubmit } className="space-y-6">
            <Section
              title="Business Info"
              icon={ <Building className="text-black w-6 h-6" /> }
            >
              <BusinessInfoSection
                formValues={ formValues }
                handleInputChange={ handleInputChange }
                errors={ errors }
              />
            </Section>

            <Section
              title="Contact Details"
              icon={ <BookUser className="text-black w-6 h-6" /> }
            >
              <ContactDetailsSection
                formValues={ formValues }
                handleInputChange={ handleInputChange }
                errors={ errors }
                handleOtpRequest={ () =>
                  handleOtpRequest(formValues.email, "vendor")
                }
                loading={ loading }
                otpMessage={ otpMessage }
                otpSent={ otpSent }
                otpError={ otpError }
              />
            </Section>

            <Section
              title="Address Details"
              icon={ <MapPinned className="text-black w-6 h-6" /> }
            >
              <AddressSection
                formValues={ formValues }
                handleInputChange={ handleInputChange }
                errors={ errors }
                countries={ countries }
                states={ states }
                cities={ cities }
              />
            </Section>

            <Section
              title="Create Password"
              icon={ <RectangleEllipsis className="text-black w-7 h-10" /> }
            >
              <PasswordSection
                formValues={ formValues }
                handleInputChange={ handleInputChange }
                errors={ errors }
                showPassword={ showPassword }
                togglePasswordVisibility={ togglePasswordVisibility }
                showConfirmPassword={ showConfirmPassword }
                toggleConfirmPasswordVisibility={
                  toggleConfirmPasswordVisibility
                }
              />
            </Section>

            <TermsCheckbox
              formValues={ formValues }
              setFormValues={ setFormValues }
              errors={ errors }
              isVendor={ true }
            />

            <div className="flex justify-center mt-10">
              <Button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 px-6 py-2 rounded-md text-white shadow-md"
              >
                Submit
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VendorSignup;

