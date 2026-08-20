import { Label } from "@/components/ui/label";
import { InputField } from "./InputField";

export const AddressSection = ({
  formValues,
  handleInputChange,
  errors,
  countries,
  states,
  cities,
}) => (
  <>
    <div>
      <InputField
        label="Address"
        name="address"
        value={formValues.address}
        onChange={handleInputChange}
        error={errors.address}
      />
    </div>

    <div>
      <Label>Country</Label>
      <select
        name="country"
        value={formValues.country}
        onChange={handleInputChange}
        className="w-full border rounded px-3 py-2 mt-2"
      >
        <option value="">Select Country</option>
        {countries.map((country) => (
          <option key={country.code} value={country.name}>
            {country.name}
          </option>
        ))}
      </select>
      {errors.country && (
        <p className="text-sm text-red-500">{errors.country}</p>
      )}
    </div>

    <div>
      <Label>State</Label>
      <select
        name="state"
        value={formValues.state}
        onChange={handleInputChange}
        className="w-full border rounded px-3 py-2"
      >
        <option value="">Select State</option>
        {states.map((state) => (
          <option key={state.iso2} value={state.name}>
            {state.name}
          </option>
        ))}
      </select>
      {errors.state && <p className="text-sm text-red-500">{errors.state}</p>}
    </div>

    <div>
      <Label>City</Label>
      <select
        name="city"
        value={formValues.city}
        onChange={handleInputChange}
        className="w-full border rounded px-3 py-2"
      >
        <option value="">Select City</option>
        {cities.map((city, index) => (
          <option key={index} value={city}>
            {city}
          </option>
        ))}
      </select>
      {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
    </div>

    <div>
      <InputField
        label="Postal Code"
        name="postalCode"
        value={formValues.postalCode}
        onChange={handleInputChange}
        error={errors.postalCode}
      />
    </div>
  </>
);
