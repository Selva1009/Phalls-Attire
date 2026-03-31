"use client";

import { API_BASE_URL } from "@/lib/api";
import { useState, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import Swal from "sweetalert2";
import { IoBagAdd } from "react-icons/io5";

export default function AddProduct() {
  const [vendorUserId, setVendorUserId] = useState(null);
  const [vendorUser, setVendorUser] = useState(null);

  const [formData, setFormData] = useState({
    category: "",
    brand: "",
    productName: "",
    price: "",
    hsn_code: "",
    stock_status: "",
    description: "",
    seller: "",
  });

  const [productImage, setProductImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    const storedVendor = localStorage.getItem("vendorUser");
    if (storedVendor) {
      const parsedVendor = JSON.parse(storedVendor);

      // ✅ Set vendorUserId as a number (ID only)
      setVendorUserId(parsedVendor.id);

      // ✅ Set full vendor user object for things like companyName
      setVendorUser(parsedVendor);
    } else {
      Swal.fire({
        title: "Vendor Not Logged In!",
        text: "Please log in again to continue adding products.",
        icon: "warning",
        confirmButtonColor: "#d33",
        confirmButtonText: "OK",
      }).then(() => {
        window.location.href = "/vendor/login";
      });
    }
  }, []);

  useEffect(() => {
    if (vendorUser?.companyName) {
      setFormData((prev) => ({
        ...prev,
        seller: vendorUser.companyName,
      }));
    }
  }, [vendorUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "seller") return; // seller should not be changed manually
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setProductImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!vendorUserId) {
      Swal.fire({
        title: "Error!",
        text: "Vendor user ID not available.",
        icon: "error",
      });
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("productName", formData.productName);
    formDataToSend.append("brand", formData.brand);
    formDataToSend.append("category", formData.category);
    formDataToSend.append("price", formData.price);
    formDataToSend.append("hsn_code", formData.hsn_code);
    formDataToSend.append("stock_status", formData.stock_status);
    formDataToSend.append("seller", formData.seller);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("vendor_user_id", vendorUserId);
    if (productImage) {
      formDataToSend.append("productImage", productImage);
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/products/add-product`,
        {
          method: "POST",
          body: formDataToSend,
        }
      );

      if (response.status === 403) {
        const data = await response.json();
        Swal.fire({
          title: "Product Limit Reached!",
          text:
            data.message ||
            "You have reached the product limit. Please upgrade your subscription to add more products.",
          imageUrl: "/subscription.gif",
          imageWidth: 127,
          imageHeight: 151,
          imageAlt: "Update Success",
          confirmButtonColor: "#d33",
          confirmButtonText: "OK",
        });
        return; // Stop further execution if limit is reached
      }

      if (!response.ok) {
        throw new Error("Failed to add product");
      }

      Swal.fire({
        title: "Success!",
        text: "Product added successfully!",
        icon: "success",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
      });

      // Reset form
      setFormData({
        category: "",
        brand: "",
        productName: "",
        price: "",
        hsn_code: "",
        stock_status: "",
        description: "",
        seller: "",
      });
      setProductImage(null);
      setPreviewImage(null);
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: error.message,
        icon: "error",
        confirmButtonColor: "#d33",
        confirmButtonText: "OK",
      });
    }
  };

  return (
    <>
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-lg mt-8 font-sans w-full md:w-4/5 lg:w-3/5">
        <h2 className="text-lg font-bold text-black mb-4 text-left flex items-center gap-2">
          <IoBagAdd size={25} />
          Add New Product
        </h2>

        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-black"
          onSubmit={handleSubmit}
        >
          <div>
            <label className="block font-medium mb-2">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md font-sans"
              required
            >
              <option value="" className="bg-gray-200">
                Select Product Category
              </option>

              <optgroup label="Product Categories">
                <option value="Exquisite Churidar Suits">
                  Exquisite Churidar Suits
                </option>
                <option value="Premium Co-Ord Sets">Premium Co-Ord Sets</option>
                <option value="Designer Gowns">Designer Gowns</option>
                <option value="Kurta Pant Dupatta Ensembles">
                  Kurta, Pant & Dupatta Ensembles
                </option>
                <option value="Nightwear Trio Sets">Nightwear Trio Sets</option>
                <option value="Pure Cotton Nightwear">
                  Pure Cotton Nightwear
                </option>
                <option value="Signature Leggings">Signature Leggings</option>
                <option value="Ethnic Tops with Palazzo">
                  Ethnic Tops with Palazzo
                </option>
                <option value="Trendy Tops & T-Shirts">
                  Trendy Tops & T-Shirts
                </option>
                <option value="Designer Sarees">Designer Sarees</option>
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block font-medium mb-2">Make & Model</label>
            <input
              type="text"
              name="brand"
              value={formData.brand}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md font-sans"
              required
              placeholder="Enter Make & Model"
            />
          </div>

          {/* Row 2 */}
          <div>
            <label className="block font-medium mb-2">Product Name</label>
            <input
              type="text"
              name="productName"
              value={formData.productName}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md font-sans"
              required
              placeholder="Enter Product Name"
            />
          </div>

          <div>
            <label className="block font-medium mb-2">Price</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md font-sans"
              required
              placeholder="Enter Product Price"
            />
          </div>

          <div>
            <label className="block font-medium mb-2">HSN Code</label>
            <input
              type="text"
              name="hsn_code"
              value={formData.hsn_code}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md font-sans"
              required
              placeholder="Enter HSN Code"
            />
          </div>

          <div>
            <label className="block font-medium mb-2">Stock Status</label>
            <select
              name="stock_status"
              value={formData.stock_status}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md font-sans"
              required
            >
              <option value="">Select Stock Status</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>

          {/* Row 3 */}
          <div>
            <label className="block font-medium mb-2">Seller</label>
            <input
              type="text"
              name="seller"
              value={formData.seller}
              disabled
              className="w-full p-2 border rounded-md font-sans bg-gray-100 cursor-not-allowed"
              placeholder="Seller Name"
            />
          </div>

          <div>
            <label className="block font-medium mb-2">Image</label>
            <input
              type="file"
              onChange={handleImageChange}
              className="w-full p-2 border rounded-md font-sans"
              required
            />
          </div>

          {/* Image Preview */}
          {previewImage && (
            <div className="col-span-1 md:col-span-2 flex justify-center">
              <img
                src={previewImage}
                alt="Product Preview"
                className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-lg border"
              />
            </div>
          )}

          {/* Row 4 (Full Width) */}
          <div className="col-span-1 md:col-span-2">
            <label className="block font-medium mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md h-24 font-sans"
              required
              placeholder="Enter Product Description"
            />
          </div>

          {/* Submit Button (Full Width) */}
          <div className="col-span-1 md:col-span-2 flex justify-start">
            <button
              type="submit"
              className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition font-sans w-full sm:w-auto"
            >
              Add Product
            </button>
          </div>
        </form>

        <ToastContainer />
      </div>
    </>
  );
}
