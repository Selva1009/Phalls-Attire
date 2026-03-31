"use client";
import { API_BASE_URL } from "@/lib/api";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FaSearch } from "react-icons/fa";

export default function EcommercePage() {
  const router = useRouter();
  const [vendorUserId, setVendorUserId] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const itemsPerPage = 20;
  const [currentPage, setCurrentPage] = useState(1);

  // ✅ Fixed: Correct key from localStorage
  useEffect(() => {
    const idFromStorage = localStorage.getItem("vendorUserId");
    if (idFromStorage) {
      setVendorUserId(idFromStorage);
    } else {
      setError("Vendor user ID not found in localStorage.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!vendorUserId) return;

    let isMounted = true;
    const fetchProducts = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/auth/products/get-products/${vendorUserId}`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.statusText}`);
        }
        const data = await response.json();
        if (isMounted) {
          setProducts(data.products);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, [vendorUserId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) =>
      product.productName.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const selectedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  return (
    <div className="min-h-screen border border-gray-200">
      {/* Navbar */}
      <nav className="bg-white shadow-md py-4 px-6 flex flex-col md:flex-row justify-between items-center border-b border-gray-300">
        <h1 className="text-2xl font-semibold text-gray-900">Product Spot</h1>
        <div className="flex gap-4 items-center mt-2 md:mt-0">
          <div className="relative w-full md:w-[300px]">
            <input
              type="text"
              placeholder="Search products"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FaSearch className="absolute right-3 top-3 text-gray-600" />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-6 bg-gray-50">
        {error && <div className="text-red-500">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {selectedProducts.length > 0
            ? selectedProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-gray-50 rounded-xl shadow-md overflow-hidden p-4 border border-gray-300 transition-all duration-300 transform hover:scale-105 cursor-pointer"
                >
                  <div className="relative">
                    {product.productImage && (
                      <img
                        src={`${API_BASE_URL}/uploads/${product.productImage}`}
                        alt={product.productName}
                        className="w-full h-60 object-cover rounded-lg"
                      />
                    )}
                  </div>
                  <div className="mt-4 text-left">
                    <h3 className="text-lg text-gray-700 hover:text-blue-700 font-bold truncate">
                      {product.productName}
                    </h3>
                    <p className="text-md text-gray-600">{product.brand}</p>
                    <p className="text-xl font-bold text-black mt-2">
                      ₹{product.price}
                    </p>
                  </div>
                </div>
              ))
            : !loading && (
                <p className="text-gray-600 text-center col-span-full">
                  No products available.
                </p>
              )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-wrap justify-center items-center mt-6 space-x-2">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="bg-blue-500 text-white hover:bg-blue-700 px-4 py-2"
            >
              Previous
            </Button>

            {(() => {
              const rangeSize = 5;
              const halfRange = Math.floor(rangeSize / 2);
              let startPage = Math.max(1, currentPage - halfRange);
              let endPage = Math.min(totalPages, startPage + rangeSize - 1);

              if (endPage - startPage + 1 < rangeSize) {
                startPage = Math.max(1, endPage - rangeSize + 1);
              }

              return Array.from(
                { length: endPage - startPage + 1 },
                (_, index) => startPage + index
              ).map((page) => (
                <Button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-4 py-2 ${
                    page === currentPage
                      ? "bg-blue-500 text-white hover:bg-blue-700"
                      : "bg-white text-black hover:bg-blue-700 hover:text-white border border-gray-300"
                  }`}
                >
                  {page}
                </Button>
              ));
            })()}

            <Button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="bg-blue-500 text-white hover:bg-blue-700 px-4 py-2"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
