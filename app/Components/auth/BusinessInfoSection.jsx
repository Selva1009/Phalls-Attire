import { InputField } from "./InputField";

export const BusinessInfoSection = ({ formValues, handleInputChange, errors }) => (
  <>
    <div>
      <InputField
        label="Company Name"
        name="companyName"
        value={formValues.companyName}
        onChange={handleInputChange}
        error={errors.companyName}
      />
    </div>

    <div>
      <InputField
        label="Registration Number"
        name="registrationNumber"
        value={formValues.registrationNumber}
        onChange={handleInputChange}
        error={errors.registrationNumber}
      />
    </div>

    <div>
      <InputField
        label="Company Website"
        name="companyWebsite"
        value={formValues.companyWebsite}
        onChange={handleInputChange}
        error={errors.companyWebsite}
      />
    </div>

    <div>
      <InputField
        label="GST Number"
        name="gstNumber"
        value={formValues.gstNumber}
        onChange={handleInputChange}
        error={errors.gstNumber}
      />
    </div>
  </>
);
