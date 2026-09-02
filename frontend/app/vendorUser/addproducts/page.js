"use client";

import { API_BASE_URL } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import { FileSpreadsheet, ImagePlus, Loader2, PackagePlus, Upload, X } from "lucide-react";
import Button from "@mui/material/Button";
import ArrowBack from "@mui/icons-material/ArrowBack";

const imageAccept = ".jpg,.jpeg,.png,.webp,.gif,.avif";
const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"];
const emptyForm = {
  category: "", subcategory: "", brand: "", productName: "", mrp: "",
  discount_type: "", discount_value: "", stock: "",
  stock_status: "", description: "", seller: "", sizes: {},
};
const inputClass = "mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-pink-500 focus:ring-4 focus:ring-pink-100";
const formatAmount = (value) => Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

export default function AddProduct() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [uploadMode, setUploadMode] = useState("manual");
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkImages, setBulkImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("vendorUser");
    if (!saved || localStorage.getItem("userType") !== "SUPER_ADMIN") {
      router.replace("/Home");
      return;
    }
    const parsed = JSON.parse(saved);
    setAdmin(parsed);
    setForm((current) => ({ ...current, seller: parsed.companyName || "Phalls Attire" }));
  }, [router]);

  const finalPrice = useMemo(() => {
    const price = Number(form.mrp || 0);
    const discount = Number(form.discount_value || 0);
    return Math.max(0, form.discount_type === "percentage" ? price - (price * discount / 100) : price);
  }, [form.mrp, form.discount_type, form.discount_value]);

  const totalStock = useMemo(() => Object.values(form.sizes).reduce((sum, qty) => sum + Number(qty || 0), 0), [form.sizes]);
  const selectedSizes = useMemo(() => Object.entries(form.sizes).map(([size, quantity]) => ({ size, quantity: Number(quantity || 0) })), [form.sizes]);

  const change = ({ target: { name, value } }) => setForm((current) => ({ ...current, [name]: value }));
  const toggleSize = (size) => setForm((current) => ({
    ...current,
    sizes: current.sizes[size] === undefined ? { ...current.sizes, [size]: "" } : Object.fromEntries(Object.entries(current.sizes).filter(([key]) => key !== size)),
  }));
  const changeSizeQuantity = (size, quantity) => setForm((current) => ({ ...current, sizes: { ...current.sizes, [size]: quantity } }));
  const chooseImages = (event) => {
    const selected = Array.from(event.target.files || []);
    if (selected.length > 10) return Swal.fire({ title: "Too many images", text: "Select up to 10 images.", icon: "warning" });
    setImages(selected);
  };
  const removeImage = (index) => setImages((current) => current.filter((_, i) => i !== index));

  const validate = () => {
    const mrp = Number(form.mrp);
    const discount = Number(form.discount_value || 0);
    if (!form.productName.trim() || !form.brand.trim() || !form.category || !form.description.trim()) return "Complete the product name, brand, category, and description.";
    if (!images.length) return "Add at least one product image.";
    if (!selectedSizes.length) return "Select at least one dress size.";
    if (selectedSizes.some(({ quantity }) => !Number.isInteger(quantity) || quantity < 0)) return "Each selected size needs a valid whole number quantity.";
    if (totalStock <= 0) return "Add quantity for at least one selected size.";
    if (!Number.isFinite(mrp) || mrp < 0) return "Enter a valid MRP.";
    if (!Number.isFinite(discount) || discount < 0 || (form.discount_type === "percentage" && discount > 100)) return "Enter a valid discount.";
    return "";
  };

  const submitManual = async (event) => {
    event.preventDefault();
    const error = validate();
    if (error) return Swal.fire({ title: "Check product details", text: error, icon: "warning" });
    const payload = new FormData();
    Object.entries({ ...form, discount_value: form.discount_type === "percentage" ? form.discount_value : "", stock: totalStock, sizes: JSON.stringify(selectedSizes), price: form.mrp }).forEach(([key, value]) => payload.append(key, value || ""));
    payload.append("vendor_user_id", admin.id);
    images.forEach((image) => payload.append("productImages", image));
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/products/add-product`, { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, body: payload });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to add product.");
      await Swal.fire({ title: "Product added", text: "The product is now available in the store listing.", icon: "success", confirmButtonColor: "#db2777" });
      setForm({ ...emptyForm, seller: admin.companyName || "Phalls Attire" });
      setImages([]);
      router.push("/vendorUser/productcards");
    } catch (error) {
      Swal.fire({ title: "Upload failed", text: error.message, icon: "error", confirmButtonColor: "#db2777" });
    } finally { setSaving(false); }
  };

  const downloadTemplate = (type) => {
    const headers = ["productName", "brand", "category", "price", "stock_status", "description", "productImage"];
    if (type === "csv") {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob([`${headers.join(",")}\n`], { type: "text/csv" }));
      link.download = "products-template.csv";
      link.click();
      return;
    }
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([headers]), "Products");
    XLSX.writeFile(workbook, "products-template.xlsx");
  };

  const submitBulk = async (event) => {
    event.preventDefault();
    if (!bulkFile) return Swal.fire({ title: "Choose a file", text: "Select a CSV or XLSX file.", icon: "warning" });
    const extension = bulkFile.name.toLowerCase().split(".").pop();
    if (!["csv", "xlsx"].includes(extension)) return Swal.fire({ title: "Unsupported file", text: "Only CSV and XLSX files are supported.", icon: "warning" });
    const payload = new FormData();
    payload.append("vendor_user_id", admin.id);
    payload.append("file", bulkFile);
    bulkImages.forEach((image) => payload.append("images", image));
    setBulkSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/products/bulk-upload`, { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }, body: payload });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Bulk upload failed.");
      Swal.fire({ title: "Bulk upload complete", text: `Inserted: ${data.insertedCount || 0}\nFailed: ${data.failedCount || 0}`, icon: data.failedCount ? "warning" : "success", confirmButtonColor: "#db2777" });
      setBulkFile(null); setBulkImages([]);
    } catch (error) { Swal.fire({ title: "Bulk upload failed", text: error.message, icon: "error", confirmButtonColor: "#db2777" }); }
    finally { setBulkSaving(false); }
  };

  return (
    <main className="mx-auto mt-6 w-full max-w-5xl px-3 pb-12 pt-20 sm:mt-8 sm:px-6 sm:pt-20">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
        <header className="bg-slate-950 px-5 py-7 text-white sm:px-8"><Button type="button" onClick={() => router.back()} startIcon={<ArrowBack />} sx={{ mb: 2, color: "#cbd5e1", textTransform: "none" }}>Back</Button><p className="text-xs font-semibold uppercase tracking-[0.24em] text-pink-300">Phalls Attire Store</p><div className="mt-2 flex items-center gap-3"><PackagePlus className="h-7 w-7 text-pink-300" /><h1 className="text-2xl font-bold sm:text-3xl">Add Product</h1></div><p className="mt-2 text-sm text-slate-300">Add a product manually or import your catalogue.</p></header>
        <div className="border-b border-slate-100 p-5 sm:p-8"><fieldset><legend className="text-sm font-semibold text-slate-900">Choose upload method</legend><div className="mt-3 grid gap-3 sm:grid-cols-2">{[["manual", "Manual upload", "Add one product with photos and pricing", ImagePlus], ["bulk", "Bulk upload", "Import CSV/XLSX products with images", FileSpreadsheet]].map(([value, title, text, Icon]) => <label key={value} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${uploadMode === value ? "border-pink-500 bg-pink-50 ring-4 ring-pink-100" : "border-slate-200 hover:border-slate-400"}`}><input type="radio" name="uploadMode" checked={uploadMode === value} onChange={() => setUploadMode(value)} className="h-4 w-4 accent-pink-600" /><Icon className="h-5 w-5 text-pink-600" /><span><strong className="block text-sm text-slate-900">{title}</strong><small className="text-xs text-slate-500">{text}</small></span></label>)}</div></fieldset></div>
        {uploadMode === "bulk" ? (
          <form onSubmit={submitBulk} className="space-y-6 p-5 sm:p-8"><div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center"><FileSpreadsheet className="mx-auto h-10 w-10 text-slate-500" /><h2 className="mt-3 text-lg font-semibold text-slate-900">Import product catalogue</h2><p className="mt-1 text-sm text-slate-500">Match uploaded image filenames in the <code>productImage</code> column.</p><div className="mt-4 flex flex-wrap justify-center gap-2"><button type="button" onClick={() => downloadTemplate("csv")} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700">Download CSV template</button><button type="button" onClick={() => downloadTemplate("xlsx")} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700">Download Excel template</button></div></div><label className="block text-sm font-semibold text-slate-700">CSV/XLSX file<input type="file" accept=".csv,.xlsx" onChange={(event) => setBulkFile(event.target.files?.[0] || null)} className={inputClass} required /></label><label className="block text-sm font-semibold text-slate-700">Product images<input type="file" accept={imageAccept} multiple onChange={(event) => setBulkImages(Array.from(event.target.files || []))} className={inputClass} /></label><button type="submit" disabled={bulkSaving} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{bulkSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{bulkSaving ? "Uploading..." : "Upload catalogue"}</button></form>
        ) : (
          <form onSubmit={submitManual} className="space-y-8 p-5 sm:p-8">
            <section><h2 className="text-lg font-semibold text-slate-900">Product images</h2><label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-pink-200 bg-pink-50/50 px-5 py-8 text-center"><ImagePlus className="h-8 w-8 text-pink-600" /><span className="mt-2 text-sm font-semibold text-slate-800">Choose up to 10 images</span><span className="mt-1 text-xs text-slate-500">JPG, PNG, WEBP, GIF, or AVIF</span><input type="file" accept={imageAccept} multiple onChange={chooseImages} className="sr-only" required /></label>{images.length > 0 && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">{images.map((image, index) => <div key={`${image.name}-${image.lastModified}`} className="group relative aspect-square overflow-hidden rounded-lg border"><img src={URL.createObjectURL(image)} alt={`Product preview ${index + 1}`} className="h-full w-full object-cover" /><button type="button" onClick={() => removeImage(index)} aria-label={`Remove image ${index + 1}`} className="absolute right-2 top-2 rounded-full bg-slate-950/80 p-1.5 text-white opacity-0 transition group-hover:opacity-100"><X className="h-4 w-4" /></button></div>)}</div>}</section>
            <section><h2 className="mb-4 border-b border-slate-100 pb-3 text-lg font-semibold text-slate-900">Product information</h2><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Product name<input className={inputClass} name="productName" placeholder="Enter product name" value={form.productName} onChange={change} required /></label><label className="text-sm font-semibold text-slate-700">Brand / make<input className={inputClass} name="brand" placeholder="Enter brand or make" value={form.brand} onChange={change} required /></label><label className="text-sm font-semibold text-slate-700">Category<select className={inputClass} name="category" value={form.category} onChange={change} required><option value="">Select category</option>{["Exquisite Churidar Suits", "Premium Co-Ord Sets", "Designer Gowns", "Kurta Pant Dupatta Ensembles", "Nightwear Trio Sets", "Pure Cotton Nightwear", "Signature Leggings", "Designer Sarees"].map((category) => <option key={category}>{category}</option>)}</select></label><label className="text-sm font-semibold text-slate-700">Subcategory<input className={inputClass} name="subcategory" placeholder="Enter subcategory (optional)" value={form.subcategory} onChange={change} /></label><label className="text-sm font-semibold text-slate-700 sm:col-span-2">Description<textarea className={`${inputClass} min-h-28`} name="description" placeholder="Describe fabric, fit, colour, and key details" value={form.description} onChange={change} required /></label></div></section>
            <section><h2 className="mb-4 border-b border-slate-100 pb-3 text-lg font-semibold text-slate-900">Pricing</h2><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"><label className="text-sm font-semibold text-slate-700">MRP<input className={inputClass} type="number" min="0" step="0.01" name="mrp" placeholder="Enter MRP" value={form.mrp} onChange={change} required />{form.mrp && <span className="mt-1 block text-xs text-slate-500">Rs. {formatAmount(form.mrp)}</span>}</label><label className="text-sm font-semibold text-slate-700">Discount type<select className={inputClass} name="discount_type" value={form.discount_type} onChange={change}><option value="">No discount</option><option value="percentage">Percentage</option></select></label><label className="text-sm font-semibold text-slate-700">Discount value<input className={inputClass} type="number" min="0" max="100" step="0.01" name="discount_value" placeholder="Enter discount %" value={form.discount_value} onChange={change} disabled={form.discount_type !== "percentage"} />{form.discount_value && <span className="mt-1 block text-xs text-slate-500">{formatAmount(form.discount_value)}% discount</span>}</label></div><div className="mt-5 rounded-xl bg-slate-950 px-4 py-4 text-white"><span className="text-sm text-slate-300">Final price</span><strong className="ml-3 text-xl">Rs. {formatAmount(finalPrice)}</strong></div></section>
            <section><h2 className="mb-4 border-b border-slate-100 pb-3 text-lg font-semibold text-slate-900">Inventory & dress sizes</h2><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Total stock<input className={`${inputClass} bg-slate-50`} type="number" min="0" step="1" name="stock" value={totalStock} readOnly required /></label><label className="text-sm font-semibold text-slate-700">Stock status<select className={inputClass} name="stock_status" value={form.stock_status} onChange={change} required><option value="">Select status</option><option>In Stock</option><option>Low Stock</option><option>Out of Stock</option></select></label></div><fieldset className="mt-5"><legend className="text-sm font-semibold text-slate-700">Dress size quantity</legend><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{sizeOptions.map((size) => <div key={size} className={`rounded-lg border p-3 transition ${form.sizes[size] !== undefined ? "border-pink-300 bg-pink-50" : "border-slate-200 bg-white"}`}><label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.sizes[size] !== undefined} onChange={() => toggleSize(size)} className="h-4 w-4 accent-pink-600" />{size}</label><input className={inputClass} type="number" min="0" step="1" placeholder={`${size} quantity`} value={form.sizes[size] ?? ""} onChange={(event) => changeSizeQuantity(size, event.target.value)} disabled={form.sizes[size] === undefined} /></div>)}</div><p className="mt-2 text-xs text-slate-500">Customers will see only sizes with available quantity.</p></fieldset></section>
            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end"><button type="button" onClick={() => router.push("/vendorUser/productcards")} className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700">Cancel</button><button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-pink-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}{saving ? "Saving product..." : "Add product"}</button></div>
          </form>
        )}
      </section>
    </main>
  );
}
