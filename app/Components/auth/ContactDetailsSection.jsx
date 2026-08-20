import clsx from "clsx";
import { InputField } from "./InputField";

export const ContactDetailsSection = ({
  formValues,
  handleInputChange,
  errors,
  handleOtpRequest,
  loading,
  otpMessage,
  otpSent,
  otpError,
}) => {
  return (
    <>
      <div>
        <InputField
          label="First Name"
          name="firstName"
          value={formValues.firstName}
          onChange={handleInputChange}
          error={errors.firstName}
        />
      </div>

      <div>
        <InputField
          label="Last Name"
          name="lastName"
          value={formValues.lastName}
          onChange={handleInputChange}
          error={errors.lastName}
        />
      </div>

      <div>
        <InputField
          label="Phone Number"
          name="phoneNumber"
          value={formValues.phoneNumber}
          onChange={handleInputChange}
          error={errors.phoneNumber}
        />
      </div>

      <div>
        <InputField
          label="Email"
          name="email"
          placeholder={`abc@${
            formValues.companyName
              ?.toLowerCase()
              ?.replace(/\s?(pvt|ltd|limited|inc|llp|corp|co)\b/gi, "")
              ?.replace(/\./g, "")
              ?.trim()
              ?.split(/\s+/)[0] || "company"
          }`}
          value={formValues.email}
          onChange={handleInputChange}
          error={errors.email}
          loading={loading}
          onOtpRequest={() => handleOtpRequest(formValues.email, "vendor")}
        />
      </div>

      <div>
        <InputField
          id="otp"
          label="OTP"
          name="otp"
          value={formValues.otp}
          onChange={handleInputChange}
          error={errors.otp || otpError}
        />
      </div>

      {otpMessage && (
        <p className={`text-sm ${otpSent ? "text-green-500" : "text-red-500"}`}>
          {otpMessage}
        </p>
      )}
    </>
  );
};
