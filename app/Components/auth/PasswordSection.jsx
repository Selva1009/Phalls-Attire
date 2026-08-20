import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";

export const PasswordSection = ({
  formValues,
  handleInputChange,
  errors,
  showPassword,
  togglePasswordVisibility,
  showConfirmPassword,
  toggleConfirmPasswordVisibility,
}) => (
  <>
    <div className="relative">
      <Label htmlFor="password">Password</Label>
      <Input
        id="password"
        type={showPassword ? "text" : "password"}
        placeholder="Enter Password"
        name="password"
        value={formValues.password}
        onChange={handleInputChange}
        className="w-full"
        autoComplete="new-password"
      />
      {errors.password && (
        <p className="text-sm text-red-500">{errors.password}</p>
      )}
      <div
        className="absolute right-3 top-[41px] transform -translate-y-1/2 cursor-pointer"
        onClick={togglePasswordVisibility}
      >
        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </div>
    </div>

    <div className="relative">
      <Label htmlFor="confirmPassword">Confirm Password</Label>
      <Input
        id="confirmPassword"
        type={showConfirmPassword ? "text" : "password"}
        placeholder="Confirm Password"
        name="confirmPassword"
        value={formValues.confirmPassword}
        onChange={handleInputChange}
        className="w-full"
      />
      <div
        className="absolute right-3 top-[41px] transform -translate-y-1/2 cursor-pointer"
        onClick={toggleConfirmPasswordVisibility}
      >
        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
      </div>
    </div>
  </>
);
