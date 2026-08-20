export const TermsCheckbox = ({ formValues, setFormValues, errors }) => (
  <div className="flex items-center pl-2 gap-2 ml-1 relative">
    <input
      type="checkbox"
      id="terms"
      checked={formValues.terms}
      onChange={(e) =>
        setFormValues((prev) => ({
          ...prev,
          terms: e.target.checked,
        }))
      }
      className="absolute left-0 cursor-pointer"
    />
    <label
      htmlFor="terms"
      className="text-sm text-gray-700 cursor-pointer ml-3"
    >
      By Signing Up, you must agree to our
      <a href="/policy" className="text-blue-500 hover:underline mx-1">
        Privacy Policy
      </a>
      <>
        and
        <a href="/legal" className="text-blue-500 hover:underline ml-1">
          Legal Disclaimer
        </a>
      </>
      .
    </label>
    {errors.terms && <p className="text-sm text-red-500">{errors.terms}</p>}
  </div>
);
