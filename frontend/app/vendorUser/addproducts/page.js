"use client";

import { API_BASE_URL } from "@/lib/api";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { ToastContainer } from "react-toastify";
import Swal from "sweetalert2";
import { IoBagAdd } from "react-icons/io5";

export default function AddProduct() {
  const router = useRouter();
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
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkImages, setBulkImages] = useState([]);
  const [restoreImages, setRestoreImages] = useState([]);
  const [restoringImages, setRestoringImages] = useState(false);

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
        router.push("/vendor/login");
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
    if (!file) return;
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

  const bulkHeaders = [
    "productName",
    "brand",
    "category",
    "price",
    "hsn_code",
    "stock_status",
    "description",
    "productImage",
  ];

  const downloadTemplate = (type) => {
    if (type === "csv") {
      const csvContent = `${bulkHeaders.join(",")}\n`;
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "products-template.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    const worksheet = XLSX.utils.aoa_to_sheet([bulkHeaders]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    XLSX.writeFile(workbook, "products-template.xlsx");
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();

    if (!vendorUserId) {
      Swal.fire({
        title: "Error!",
        text: "Vendor user ID not available.",
        icon: "error",
      });
      return;
    }

    if (!bulkFile) {
      Swal.fire({
        title: "Missing File",
        text: "Please upload a CSV or XLSX file.",
        icon: "warning",
      });
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("vendor_user_id", vendorUserId);
    formDataToSend.append("file", bulkFile);
    bulkImages.forEach((image) => {
      formDataToSend.append("images", image);
    });

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/products/bulk-upload`,
        {
          method: "POST",
          body: formDataToSend,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Bulk upload failed.");
      }

      const errorPreview = (data.errors || [])
        .slice(0, 5)
        .map((err) => `Row ${err.row}: ${err.reason}`)
        .join("\n");

      Swal.fire({
        title: "Bulk Upload Complete",
        text:
          `Inserted: ${data.insertedCount || 0}\n` +
          `Failed: ${data.failedCount || 0}` +
          (errorPreview ? `\n\n${errorPreview}` : ""),
        icon: data.failedCount ? "warning" : "success",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "OK",
      });

      setBulkFile(null);
      setBulkImages([]);
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

  const handleImageRestore = async (e) => {
    e.preventDefault();

    if (!vendorUserId) {
      Swal.fire({
        title: "Error!",
        text: "Vendor user ID not available.",
        icon: "error",
      });
      return;
    }

    if (!restoreImages.length) {
      Swal.fire({
        title: "Missing Images",
        text: "Select the product images you want to restore.",
        icon: "warning",
      });
      return;
    }

    const restoreFormData = new FormData();
    restoreFormData.append("vendor_user_id", vendorUserId);
    restoreImages.forEach((image) => restoreFormData.append("images", image));

    setRestoringImages(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/products/restore-product-images`,
        { method: "POST", body: restoreFormData }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Image recovery failed.");
      }

      const unmatchedPreview = (data.unmatched || []).slice(0, 5).join("\n");
      Swal.fire({
        title: "Image Recovery Complete",
        text:
          `Restored: ${data.restoredCount || 0}\n` +
          `Unmatched: ${data.unmatchedCount || 0}\n` +
          `Failed: ${data.failedCount || 0}` +
          (unmatchedPreview ? `\n\nUnmatched files:\n${unmatchedPreview}` : ""),
        icon: data.unmatchedCount || data.failedCount ? "warning" : "success",
        confirmButtonColor: "#3085d6",
      });
      setRestoreImages([]);
    } catch (error) {
      Swal.fire({
        title: "Recovery Failed",
        text: error.message,
        icon: "error",
        confirmButtonColor: "#d33",
      });
    } finally {
      setRestoringImages(false);
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
          className="mb-8 rounded-lg border border-dashed border-pink-300 bg-pink-50/40 p-4 text-sm text-gray-700"
          onSubmit={handleImageRestore}
        >
          <div className="flex flex-col gap-3">
            <div>
              <p className="font-semibold text-black">Restore Existing Product Images</p>
              <p className="mt-1 text-xs text-gray-600">
                Select all images at once. Each filename must exactly match the existing
                <code className="ml-1">productImage</code> value in the database.
              </p>
            </div>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif,.avif"
              multiple
              onChange={(e) => setRestoreImages(Array.from(e.target.files || []))}
              className="w-full rounded-md border bg-white p-2 font-sans"
            />
            <p className="text-xs text-gray-600">
              Selected: {restoreImages.length} image{restoreImages.length === 1 ? "" : "s"}
            </p>
            <button
              type="submit"
              disabled={restoringImages || !restoreImages.length}
              className="w-full rounded-md bg-pink-700 px-6 py-2 font-sans text-white transition hover:bg-pink-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {restoringImages ? "Restoring Images..." : "Restore Product Images"}
            </button>
          </div>
        </form>

        <form
          className="mb-8 rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-700"
          onSubmit={handleBulkUpload}
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <p className="font-semibold text-black">Bulk Upload (CSV/XLSX)</p>
              <p className="text-xs text-gray-600">
                Upload a CSV/XLSX file and images together. The <code>productImage</code> column
                must match the uploaded image filenames.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => downloadTemplate("csv")}
                  className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-100"
                >
                  Download CSV Template
                </button>
                <button
                  type="button"
                  onClick={() => downloadTemplate("xlsx")}
                  className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-100"
                >
                  Download Excel Template
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block font-medium mb-2">CSV/XLSX File</label>
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border rounded-md font-sans"
                />
              </div>
              <div>
                <label className="block font-medium mb-2">Product Images</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.gif,.avif"
                  multiple
                  onChange={(e) => setBulkImages(Array.from(e.target.files || []))}
                  className="w-full p-2 border rounded-md font-sans"
                />
              </div>
            </div>

            <div className="flex justify-start">
              <button
                type="submit"
                className="bg-gray-900 text-white px-6 py-2 rounded-md hover:bg-black transition font-sans w-full sm:w-auto"
              >
                Upload Bulk Products
              </button>
            </div>
          </div>
        </form>

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
              accept=".jpg,.jpeg,.png,.webp,.gif,.avif"
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
