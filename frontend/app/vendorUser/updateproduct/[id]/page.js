"use client";

import { API_BASE_URL, getProductImageSource } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { IoCreateOutline } from "react-icons/io5";
import Button from "@mui/material/Button";
import ArrowBack from "@mui/icons-material/ArrowBack";

const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"];
const inputClass = "w-full p-2 border rounded-md";
const formatAmount = (value) => Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const parseSizeQuantities = (value) => {
  try {
    const parsed = Array.isArray(value) ? value : JSON.parse(value || "[]");
    if (!Array.isArray(parsed)) return {};
    return parsed.reduce((acc, item) => {
      if (typeof item === "object" && item?.size) acc[String(item.size).trim().toUpperCase()] = String(item.quantity ?? "");
      else if (item) acc[String(item).trim().toUpperCase()] = "";
      return acc;
    }, {});
  } catch {
    return String(value || "").split(",").reduce((acc, size) => {
      const key = size.trim().toUpperCase();
      if (key) acc[key] = "";
      return acc;
    }, {});
  }
};

export default function UpdateProduct() {
  const { id } = useParams(); // ✅ fixed
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = searchParams.get("page") || 1;
  const returnToParam = searchParams.get("returnTo");
  const safeReturnTo = useMemo(() => {
    if (!returnToParam) {
      return `/vendorUser/productcards?page=${encodeURIComponent(currentPage)}`;
    }
    if (returnToParam.startsWith("/vendorUser/")) {
      return returnToParam;
    }
    return `/vendorUser/productcards?page=${encodeURIComponent(currentPage)}`;
  }, [returnToParam, currentPage]);
  const [formData, setFormData] = useState({
    productName: "",
    brand: "",
    category: "",
    subcategory: "",
    mrp: "",
    discount_type: "",
    discount_value: "",
    description: "",
    stock_status: "",
    sizes: {},
    status: "active",
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
          subcategory: product.subcategory || "",
          mrp: product.mrp ?? product.selling_price ?? product.price ?? "",
          discount_type: product.discount_type || "",
          discount_value: product.discount_value ?? "",
          description: product.description || "",
          stock_status: product.stock_status || "",
          sizes: parseSizeQuantities(product.sizes),
          status: product.status || "active",
        });
        if (getProductImageSource(data.product, imageCacheBuster)) {
          setPreviewImage(getProductImageSource(data.product, imageCacheBuster));
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
  const toggleSize = (size) => setFormData((current) => ({
    ...current,
    sizes: current.sizes[size] === undefined ? { ...current.sizes, [size]: "" } : Object.fromEntries(Object.entries(current.sizes).filter(([key]) => key !== size)),
  }));
  const changeSizeQuantity = (size, quantity) => setFormData((current) => ({ ...current, sizes: { ...current.sizes, [size]: quantity } }));
  const selectedSizes = useMemo(() => Object.entries(formData.sizes).map(([size, quantity]) => ({ size, quantity: Number(quantity || 0) })), [formData.sizes]);
  const totalStock = useMemo(() => selectedSizes.reduce((sum, item) => sum + item.quantity, 0), [selectedSizes]);
  const finalPrice = useMemo(() => {
    const mrp = Number(formData.mrp || 0);
    const discount = Number(formData.discount_value || 0);
    return Math.max(0, formData.discount_type === "percentage" ? mrp - (mrp * discount / 100) : mrp);
  }, [formData.mrp, formData.discount_type, formData.discount_value]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setSelectedImage(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productName.trim() || !formData.brand.trim() || !formData.category || !formData.description.trim()) return Swal.fire("Check product details", "Complete the product name, brand, category, and description.", "warning");
    if (!selectedSizes.length || selectedSizes.some(({ quantity }) => !Number.isInteger(quantity) || quantity < 0) || totalStock <= 0) return Swal.fire("Check inventory", "Add valid quantity for at least one dress size.", "warning");
    setUpdating(true);

    const formDataToSend = new FormData();
    formDataToSend.append("productName", formData.productName);
    formDataToSend.append("brand", formData.brand);
    formDataToSend.append("category", formData.category);
    formDataToSend.append("subcategory", formData.subcategory);
    formDataToSend.append("price", formData.mrp);
    formDataToSend.append("mrp", formData.mrp);
    formDataToSend.append("selling_price", formData.mrp);
    formDataToSend.append("discount_type", formData.discount_type);
    formDataToSend.append("discount_value", formData.discount_type === "percentage" ? formData.discount_value : "");
    formDataToSend.append("description", formData.description);
    formDataToSend.append("stock_status", formData.stock_status);
    formDataToSend.append("stock", totalStock);
    formDataToSend.append("sizes", JSON.stringify(selectedSizes));
    formDataToSend.append("status", formData.status);
    if (selectedImage) {
      formDataToSend.append("productImage", selectedImage);
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/products/update-product/${id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
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
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-lg mt-28 font-sans">
      <Button type="button" onClick={() => router.back()} startIcon={<ArrowBack />} sx={{ mb: 1, textTransform: "none" }}>Back</Button>
      <h2 className="text-lg font-bold text-black mb-4 text-left flex items-center gap-2">
        <IoCreateOutline size={ 25 } /> Update Product
      </h2>

      <form
        className="grid grid-cols-2 gap-6 text-sm text-black"
        onSubmit={ handleSubmit }
      >
        <div>
          <label className="block font-medium mb-2">Product Name</label>
          <input type="text" name="productName" value={ formData.productName } onChange={ handleInputChange } className={ inputClass } required />
        </div>

        <div>
          <label className="block font-medium mb-2">Brand / make</label>
          <input type="text" name="brand" value={ formData.brand } onChange={ handleInputChange } className={ inputClass } required />
        </div>

        <div>
          <label className="block font-medium mb-2">Category</label>
          <select name="category" value={ formData.category } onChange={ handleInputChange } className={ inputClass } required>
            <option value="">Select category</option>
            {["Exquisite Churidar Suits", "Premium Co-Ord Sets", "Designer Gowns", "Kurta Pant Dupatta Ensembles", "Nightwear Trio Sets", "Pure Cotton Nightwear", "Signature Leggings", "Designer Sarees"].map((category) => <option key={category}>{category}</option>)}
          </select>
        </div>

        <div>
          <label className="block font-medium mb-2">Subcategory</label>
          <input type="text" name="subcategory" value={ formData.subcategory } onChange={ handleInputChange } className={ inputClass } placeholder="Enter subcategory (optional)" />
        </div>

        <div>
          <label className="block font-medium mb-2">MRP</label>
          <input type="number" min="0" step="0.01" name="mrp" value={ formData.mrp ?? "" } onChange={ handleInputChange } className={ inputClass } required />
          {formData.mrp && <span className="mt-1 block text-xs text-gray-500">Rs. {formatAmount(formData.mrp)}</span>}
        </div>

        <div>
          <label className="block font-medium mb-2">Discount type</label>
          <select name="discount_type" value={ formData.discount_type } onChange={ handleInputChange } className={ inputClass }>
            <option value="">No discount</option>
            <option value="percentage">Percentage</option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-2">Discount value</label>
          <input type="number" min="0" max="100" step="0.01" name="discount_value" value={ formData.discount_value ?? "" } onChange={ handleInputChange } className={ inputClass } disabled={formData.discount_type !== "percentage"} />
          {formData.discount_value && <span className="mt-1 block text-xs text-gray-500">{formatAmount(formData.discount_value)}% discount</span>}
        </div>

        <div>
          <label className="block font-medium mb-2">Final price</label>
          <input type="text" value={`Rs. ${formatAmount(finalPrice)}`} className={`${inputClass} bg-gray-100 cursor-not-allowed`} readOnly />
        </div>

        <div>
          <label className="block font-medium mb-2">Stock Status</label>
          <select
            name="stock_status"
            value={ formData.stock_status ?? "" }
            onChange={ handleInputChange }
            className={ inputClass }
            required
          >
            <option value="">Select Stock Status</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>

        <div>
          <label className="block font-medium mb-2">Total stock</label>
          <input type="number" min="0" step="1" value={ totalStock } className={`${inputClass} bg-gray-100 cursor-not-allowed`} readOnly required />
        </div>

        <div>
          <label className="block font-medium mb-2">Image</label>
          <input
            type="file"
            onChange={ handleImageChange }
            className={ inputClass }
          />
        </div>

        <fieldset className="col-span-2">
          <legend className="block font-medium mb-2">Dress size quantity</legend>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sizeOptions.map((size) => <div key={size} className={`rounded-lg border p-3 transition ${formData.sizes[size] !== undefined ? "border-pink-300 bg-pink-50" : "border-gray-200 bg-white"}`}><label className="flex items-center gap-2 font-semibold text-gray-700"><input type="checkbox" checked={formData.sizes[size] !== undefined} onChange={() => toggleSize(size)} className="h-4 w-4 accent-pink-600" />{size}</label><input className={inputClass} type="number" min="0" step="1" placeholder={`${size} quantity`} value={formData.sizes[size] ?? ""} onChange={(event) => changeSizeQuantity(size, event.target.value)} disabled={formData.sizes[size] === undefined} /></div>)}
          </div>
        </fieldset>

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
            className={`${inputClass} h-24`}
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
