import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const InputField = ({
  label,
  name,
  value,
  onChange,
  onOtpRequest,
  type,
  placeholder,
  loading,
  error,
}) => (
  <div className="space-y-2">
    <Label htmlFor={name}>{label}</Label>
    <div className="relative">
      <Input
        id={name}
        type={type || "text"}
        placeholder={placeholder || label}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full p-2 border rounded-md ${
          name === "email" ? "pr-20" : ""
        }`}
      />
      {name === "email" && (
        <button
          type="button"
          onClick={onOtpRequest}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 font-medium"
        >
          {loading ? "Sending..." : "Get OTP"}
        </button>
      )}
    </div>
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);
