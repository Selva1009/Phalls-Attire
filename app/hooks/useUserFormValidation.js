import React from "react";

export const useUserFormValidation = () => {
  const validateForm = (formValues) => {
    let newErrors = {};
    if (!formValues.companyName)
      newErrors.companyName = "Company Name is required";

    if (!formValues.personName)
      newErrors.personName = "Person Name is required";

   const phoneKey =
      formValues.phoneNumber !== undefined ? "phoneNumber" : "contactNumber";

    const phoneValue = formValues[phoneKey];
    if (!phoneValue || !/^[0-9]{7,12}$/.test(phoneValue)) {
      newErrors[phoneKey] = "Invalid Contact Number";
    }

    if (!formValues.Email) {
      newErrors.Email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(formValues.Email)) {
      newErrors.Email = "Invalid email format";
    } else {
      const CompanyName = formValues.companyName
        ?.toLowerCase()
        .replace(/\s?(pvt|ltd|limited|inc|llp|corp|co)\b/gi, "")
        .replace(/\./g, "")
        .trim()
        .split(/\s+/)[0];

      const emailDomain = formValues.Email.split("@")[1]?.toLowerCase();
      const domainPrefix = emailDomain?.split(".")[0]; 

      if (!domainPrefix || domainPrefix !== CompanyName) {
        newErrors.Email = `Email domain must start with ${
          CompanyName || "companyName"
        } (e.g., example@${CompanyName || "companyName"})`;
      }
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
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  return { validateForm };
};
