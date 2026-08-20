"use client";
import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowBigLeftDash, DiscAlbum } from "lucide-react";
import { FiEdit2 } from "react-icons/fi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

import Swal from "sweetalert2";
import Footer from "@/app/LandingPage/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const VendorUserProfilePage = () => {
  const [vendorUser, setVendorUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    personName: "",
    phoneNumber: "",
    Email: "",
    id: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadUserData = () => {
      const storedUser = localStorage.getItem("vendorUser");
      if (!storedUser) {
        router.push("/vendorLogin");
        return;
      }

      try {
        const userData = JSON.parse(storedUser);
        setVendorUser(userData);
        setFormData({
          companyName: userData.companyName || "",
          personName: userData.personName || "",
          phoneNumber: userData.phoneNumber || "",
          Email: userData.Email || "",
          status: userData.status || "",
          id: userData.id || ""
        });
      } catch (error) {
        console.error("Error parsing user data:", error);
        router.push("/vendorLogin");
      }
    };

    loadUserData();

    const handleStorageChange = () => {
      loadUserData();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/vendor/update-user/${formData.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            companyName: formData.companyName,
            personName: formData.personName,
            phoneNumber: formData.phoneNumber,
            Email: formData.Email,
            status: formData.status,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: result.message || "Something went wrong!",
        });
      } else {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Profile updated successfully!",
        });

        localStorage.setItem("vendorUser", JSON.stringify(result.user)); // ✅ Use result.user
        setVendorUser(result.user); // ✅ Use result.user
        setFormData(result.user);   // ✅ Update formData too
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Server error. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!vendorUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading profile...</div>
      </div>
    );
  }

  const profileFields = [
    { label: "Company Name", name: "companyName", type: "text", disabled: true },
    { label: "Contact Person", name: "personName", type: "text" },
    { label: "Phone Number", name: "phoneNumber", type: "tel" },
    { label: "Email", name: "Email", type: "email", disabled: true },
    { label: "Status", name: "status", disabled: true }
  ];

  return (
    <>

      <div className="bg-gray-50 min-h-screen pt-5 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-8">
            <button
              onClick={ () => router.push("/vendorUser") }
              className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Back to products"
            >
              <ArrowBigLeftDash className="h-6 w-6 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 flex items-center">
              <div className="relative">
                <img
                  src="/User_Icon.jpg"
                  alt="Profile"
                  className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-md"
                />
                { isEditing && (
                  <div className="absolute bottom-0 right-0 bg-blue-100 p-1.5 rounded-full border-2 border-white">
                    <FiEdit2 className="text-blue-600 h-4 w-4" />
                  </div>
                ) }
              </div>
              <div className="ml-5">
                <h2 className="text-xl font-semibold text-gray-800">
                  { vendorUser.personName }
                </h2>
                <p className="text-sm text-gray-600">Vendor Account</p>
              </div>
            </div>

            <div className="p-6">
              { !isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  { profileFields.map(({ label, name }) => (
                    <div key={ name } className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        { label }
                      </p>
                      <p className="text-base font-medium text-gray-800 break-words">
                        { vendorUser[name] || (
                          <span className="text-gray-400 italic">Not provided</span>
                        ) }
                      </p>
                    </div>
                  )) }
                </div>
              ) : (
                <form onSubmit={ handleSave } className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    { profileFields.map(({ label, name, type, disabled }) => (
                      <div key={ name } className="space-y-2">
                        <Label htmlFor={ name } className="text-gray-700">
                          { label }
                        </Label>
                        <Input
                          id={ name }
                          name={ name }
                          type={ type }
                          value={ formData[name] || "" }
                          onChange={ handleChange }
                          required={ !disabled }
                          className="focus:ring-2 focus:ring-blue-500"
                          disabled={ disabled }
                        />
                      </div>
                    )) }
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={ () => {
                        setFormData(vendorUser);
                        setIsEditing(false);
                      } }
                      disabled={ isLoading }
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={ isLoading }>
                      { isLoading ? (
                        <span className="flex items-center">
                          <AiOutlineLoading3Quarters className="animate-spin mr-2 h-4 w-4" />
                          Saving...
                        </span>
                      ) : (
                        "Save Changes"
                      ) }
                    </Button>
                  </div>
                </form>
              ) }

              { !isEditing && (
                <div className="flex justify-end mt-8">
                  <Button
                    onClick={ () => setIsEditing(true) }
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Edit Profile
                  </Button>
                </div>
              ) }
            </div>
          </div>
        </div>
      </div>

    </>
  );
};

export default VendorUserProfilePage;
