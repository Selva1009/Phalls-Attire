export const useFormValidation = () => {
  const validateForm = (formValues, isVendor = false) => {
    let newErrors = {};

    if (!formValues.companyName)
      newErrors.companyName = "Company Name is required";
    if (!formValues.registrationNumber)
      newErrors.registrationNumber = "Registration Number is required";
    if (!formValues.companyWebsite)
      newErrors.companyWebsite = "Company Website is required";
    if (!formValues.gstNumber) newErrors.gstNumber = "GST Number is required";
    if (!formValues.firstName) newErrors.firstName = "First Name is required";
    if (!formValues.lastName) newErrors.lastName = "Last Name is required";

    if (
      !formValues.phoneNumber ||
      !/^[0-9]{7,12}$/.test(formValues.phoneNumber)
    ) {
      newErrors.phoneNumber = "Invalid Contact Number";
    }

    if (!formValues.email) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formValues.email)) {
      newErrors.email = "Invalid email format";
    } else {
      const CompanyName = formValues.companyName
        ?.toLowerCase()
        .replace(/\s?(pvt|ltd|limited|inc|llp|corp|co)\b/gi, "")
        .replace(/\./g, "")
        .trim()
        .split(/\s+/)[0];

      const emailDomain = formValues.email.split("@")[1]?.toLowerCase();
      const domainPrefix = emailDomain?.split(".")[0]; // Get the part before the first dot

      if (!domainPrefix || domainPrefix !== CompanyName) {
        newErrors.email = `Email domain must start with ${
          CompanyName || "companyName"
        } (e.g., example@${CompanyName || "companyName"})`;
      }
    }

    if (!formValues.otp) {
      newErrors.otp = "OTP is required";
    } else if (!/^\d{4}$/.test(formValues.otp)) {
      newErrors.otp = "OTP must be 4 digits";
    }

    if (
      !formValues.password ||
      !/^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\d).{8,}$/.test(formValues.password)
    ) {
      newErrors.password =
        "Password must be 8+ chars, with 1 uppercase, 1 number & 1 special char";
    }

    if (formValues.password !== formValues.confirmPassword) {
      newErrors.confirmPassword = "Passwords must match";
    }

    if (!formValues.terms) newErrors.terms = "You must accept the terms";
    if (!formValues.address) newErrors.address = "Address is required";
    if (!formValues.country) newErrors.country = "Country is required";
    if (!formValues.state) newErrors.state = "State is required";
    if (!formValues.city) newErrors.city = "City is required";
    if (!formValues.postalCode)
      newErrors.postalCode = "Postal Code is required";

    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  return { validateForm };
};
