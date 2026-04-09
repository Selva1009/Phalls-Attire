"use client";

import { API_BASE_URL } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { IoCreateOutline } from "react-icons/io5";

export default function UpdateProduct() {
  const { id } = useParams(); // ✅ fixed
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = searchParams.get("page") || 1;
  const returnToParam = searchParams.get("returnTo");
  const safeReturnTo = useMemo(() => {
    if (!returnToParam) {
      return `/vendorUser/productdetails?page=${encodeURIComponent(currentPage)}`;
    }
    if (returnToParam.startsWith("/vendorUser/")) {
      return returnToParam;
    }
    return `/vendorUser/productdetails?page=${encodeURIComponent(currentPage)}`;
  }, [returnToParam, currentPage]);
  const [formData, setFormData] = useState({
    productName: "",
    brand: "",
    category: "",
    price: "",
    seller: "",
    description: "",
    hsn_code: "",
    stock_status: "",
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [updating, setUpdating] = useState(false);
  const imageCacheBuster = useMemo(() => Date.now(), []);

  // ✅ Fetch product using correct `id`
  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/products/get-product/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch product");
        }
        const data = await response.json();
        console.log("Fetched data:", data);
        const product = data.product || {};
        setFormData({
          productName: product.productName || "",
          brand: product.brand || "",
          category: product.category || "",
          price: product.price ?? "",
          seller: product.seller || "",
          description: product.description || "",
          hsn_code: product.hsn_code || "",
          stock_status: product.stock_status || "",
        });
        if (data.product.productImage) {
          setPreviewImage(
            `${API_BASE_URL}/uploads/${data.product.productImage}?v=${imageCacheBuster}`
          );
        }
      } catch (error) {
        console.error("Error fetching:", error.message);
      }
    };

    fetchProduct();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setSelectedImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);

    const formDataToSend = new FormData();
    formDataToSend.append("price", formData.price);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("hsn_code", formData.hsn_code);
    formDataToSend.append("stock_status", formData.stock_status);
    if (selectedImage) {
      formDataToSend.append("productImage", selectedImage);
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/vendor/product/${id}`,
        {
          method: "PUT",
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update product");
      }

      Swal.fire({
        title: "Success!",
        text: "Product updated successfully!",
        imageUrl: "/updated.gif",
        imageWidth: 127,
        imageHeight: 151,
        imageAlt: "Update Success",
        timer: 1500,
        showConfirmButton: false,
      });

      // ✅ Redirect after update
      setTimeout(() => {
        router.push(safeReturnTo);
      }, 1500);
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-lg mt-8 font-sans">
      <h2 className="text-lg font-bold text-black mb-4 text-left flex items-center gap-2">
        <IoCreateOutline size={ 25 } /> Update Product
      </h2>

      <form
        className="grid grid-cols-2 gap-6 text-sm text-black"
        onSubmit={ handleSubmit }
      >
        <div>
          <label className="block font-medium mb-2">Category</label>
          <input
            type="text"
            name="category"
            value={ formData.category }
            onChange={ handleInputChange }
            className="w-full p-2 border rounded-md bg-gray-100 cursor-not-allowed"
            disabled
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Make & Model</label>
          <input
            type="text"
            name="brand"
            value={ formData.brand }
            onChange={ handleInputChange }
            className="w-full p-2 border rounded-md bg-gray-100 cursor-not-allowed"
            disabled
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Product Name</label>
          <input
            type="text"
            name="productName"
            value={ formData.productName }
            onChange={ handleInputChange }
            className="w-full p-2 border rounded-md bg-gray-100 cursor-not-allowed"
            disabled
            required
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Price</label>
            <input
              type="number"
              name="price"
              value={ formData.price ?? "" }
              onChange={ handleInputChange }
              className="w-full p-2 border rounded-md"
              required
            />
        </div>

        <div>
          <label className="block font-medium mb-2">HSN Code</label>
            <input
              type="text"
              name="hsn_code"
              value={ formData.hsn_code ?? "" }
              onChange={ handleInputChange }
              className="w-full p-2 border rounded-md"
              required
            />
        </div>

        <div>
          <label className="block font-medium mb-2">Stock Status</label>
          <select
            name="stock_status"
            value={ formData.stock_status ?? "" }
            onChange={ handleInputChange }
            className="w-full p-2 border rounded-md"
            required
          >
            <option value="">Select Stock Status</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-2">Seller</label>
          <input
            type="text"
            name="seller"
            value={ formData.seller }
            disabled
            className="w-full p-2 border rounded-md font-sans bg-gray-100 cursor-not-allowed"
            placeholder="Seller Name"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Image</label>
          <input
            type="file"
            onChange={ handleImageChange }
            className="w-full p-2 border rounded-md"
          />
        </div>

        { previewImage && (
          <div className="col-span-2 flex justify-center">
            <img
              src={ previewImage }
              alt="Product Preview"
              className="w-40 h-40 object-cover rounded-lg border"
            />
          </div>
        ) }

        <div className="col-span-2">
          <label className="block font-medium mb-2">Description</label>
          <textarea
            name="description"
            value={ formData.description }
            onChange={ handleInputChange }
            className="w-full p-2 border rounded-md h-24"
            required
          />
        </div>

        <div className="col-span-2 flex justify-start">
          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-2 rounded-sm hover:bg-blue-600 transition"
            disabled={ updating }
          >
            { updating ? "Updating..." : "Update Product" }
          </button>
        </div>
      </form>
    </div>
  );
}
