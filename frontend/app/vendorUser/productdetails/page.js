"use client";

import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { FaSearch, FaEdit } from "react-icons/fa";
import { Trash2, Loader2, Edit } from "lucide-react";
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import { Button } from '@/components/ui/button';

export default function ProductDetails() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const itemsPerPage = 5;

  const vendorUserId = typeof window !== "undefined" ? localStorage.getItem("vendorUserId") : null;

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      if (!vendorUserId) {
        setError("Vendor User ID not found in localStorage");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/products/get-products/${vendorUserId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.statusText}`);
        }

        const data = await response.json();
        if (isMounted) {
          setProducts(data.products || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          toast.error(err.message);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [vendorUserId]);

  const handleDelete = async (productId) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "This product will be permanently deleted!",
        imageUrl: "/trash.gif",
        imageWidth: 127,
        imageHeight: 151,
        imageAlt: "Delete Confirmation",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "No, cancel!",
        reverseButtons: true,
        customClass: {
          popup: "rounded-lg shadow-xl",
          confirmButton: "px-4 py-2 rounded-md",
          cancelButton: "px-4 py-2 rounded-md mr-2",
        },
      });

      if (result.isConfirmed) {
        setDeletingId(productId);

        const response = await fetch(`${API_BASE_URL}/api/auth/products/delete-product/${productId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to delete product");
        }

        setProducts((prevProducts) => prevProducts.filter((product) => product.id !== productId));

        await Swal.fire({
          title: "Deleted!",
          text: "Product has been successfully deleted.",
          icon: "success",
          confirmButtonColor: "#4BB543",
          customClass: {
            popup: "rounded-lg shadow-md",
          },
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete product. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (productId) => {
    router.push(`/vendorUser/updateproduct/${productId}`);
  };


  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    setCurrentPage(1);
    return products.filter((product) => {
      return (
        product?.productName?.toLowerCase().includes(query) ||
        product?.category?.toLowerCase().includes(query) ||
        product?.brand?.toLowerCase().includes(query)
      );
    });
  }, [products, searchQuery]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const selectedProducts = useMemo(() => {
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500 text-lg">{ error }</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <ToastContainer position="top-right" autoClose={ 5000 } />

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-gray-800">Your Products</h2>
        <div className="relative w-full md:w-[350px]">
          <input
            type="text"
            placeholder="Search by name, category, brand"
            value={ searchQuery }
            onChange={ (e) => setSearchQuery(e.target.value) }
            className="w-full pl-3 pr-10 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
        </div>
      </div>

      { filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">No products found. { searchQuery && "Try a different search term." }</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white shadow-md rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 tracking-wider">Image</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 tracking-wider ">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 tracking-wider">Brand</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 tracking-wider">Price</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 tracking-wider">Seller</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                { selectedProducts.map((product) => (
                  <tr key={ product.id } className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <img
                        src={ `${API_BASE_URL}/uploads/${product.productImage}` }
                        alt={ product.productName }
                        className="h-10 w-10 rounded object-cover"
                        onError={ (e) => {
                          e.target.src = "/placeholder-product.png";
                        } }
                      />
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{ product.productName }</td>
                    <td className="px-4 py-4 hidden sm:table-cell text-sm text-gray-500">{ product.brand }</td>
                    <td className="px-4 py-4 hidden md:table-cell text-sm text-gray-500">{ product.category }</td>
                    <td className="px-4 py-4 text-sm text-gray-900">₹{ product.price }</td>
                    <td className="px-4 py-4 hidden lg:table-cell text-sm text-gray-500">{ product.seller }</td>
                    <td className="px-4 py-4 text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={ () => handleEdit(product.id) }
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={ () => handleDelete(product.id) }
                          disabled={ deletingId === product.id }
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 disabled:opacity-50"
                        >
                          { deletingId === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" /> }
                        </button>
                      </div>
                    </td>
                  </tr>
                )) }
              </tbody>
            </table>
          </div>

          {/* Pagination */ }
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{ startIndex + 1 }</span> to{ " " }
              <span className="font-medium">{ Math.min(startIndex + itemsPerPage, filteredProducts.length) }</span> of{ " " }
              <span className="font-medium">{ filteredProducts.length }</span> results
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={ currentPage === 1 }
                onClick={ () => setCurrentPage((prev) => prev - 1) }
                className="px-3 py-1 2xl:px-4 2xl:py-2 rounded-lg border-gray-300 hover:bg-gray-100 transition-colors flex items-center gap-1 text-sm 2xl:text-base"
              >
                <ChevronLeft className="h-4 w-4 2xl:h-5 2xl:w-5" />
                <span>Previous</span>
              </Button>

              { Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={ pageNum }
                    onClick={ () => setCurrentPage(pageNum) }
                    className={ `px-3 py-1 border rounded-md text-sm font-medium ${currentPage === pageNum ? "bg-blue-500 text-white" : "bg-white text-gray-700 hover:bg-gray-50"
                      }` }
                  >
                    { pageNum }
                  </button>
                );
              }) }

              <Button
                variant="outline"
                size="sm"
                disabled={ currentPage === totalPages }
                onClick={ () => setCurrentPage((prev) => prev + 1) }
                className="px-3 py-1 2xl:px-4 2xl:py-2 rounded-lg border-gray-300 hover:bg-gray-100 transition-colors flex items-center gap-1 text-sm 2xl:text-base"
              >
                <span>Next</span>
                <ChevronRight className="h-4 w-4 2xl:h-5 2xl:w-5" />
              </Button>
            </div>
          </div>
        </>
      ) }
    </div>
  );
}
