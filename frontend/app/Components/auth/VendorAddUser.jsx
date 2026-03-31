"use client";
import { InputField } from "./InputField";

export const VendorAddUser = ({
  formValues,
  handleInputChange,
  errors,
  loading
}) => {
  return (
    <>
      <div>
        <InputField
          label="Company Name"
          name="companyName"
          value={formValues.companyName || ""}
          onChange={handleInputChange}
          error={errors.companyName}
          disabled={true}
        />
      </div>

      <div className="mb-4">
        <InputField
          label="Person Name"
          name="personName" 
          value={formValues.personName || ""} 
          onChange={handleInputChange}
          error={errors.personName} 
        />
      </div>

      <div className="mb-4">
        <InputField
          label="Contact Number"
          name="phoneNumber"
          value={formValues.phoneNumber || ""}
          onChange={handleInputChange}
          error={errors.phoneNumber}
        />
      </div>

     <div>
        <InputField
          label="Email"
          name="Email"
          placeholder={`abc@${
            formValues.companyName
              ?.toLowerCase()
              ?.replace(/\s?(pvt|ltd|limited|inc|llp|corp|co)\b/gi, "")
              ?.replace(/\./g, "")
              ?.trim()
              ?.split(/\s+/)[0] || "company"
          }`}
          value={formValues.Email}
          onChange={handleInputChange}
          error={errors.Email}
          loading={loading}
        
        />
      </div>
    </>
  );
};
