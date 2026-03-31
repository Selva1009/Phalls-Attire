"use client";
import { API_BASE_URL } from "@/lib/api";
import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import {
  BadgePercent,
  CheckCircle,
  XCircle,
  Sparkles,
  Gift,
  CalendarCheck2,
} from "lucide-react";

const CustomerUserVouchers = () => {
  const [customerId, setCustomerId] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedCustomerUserId = localStorage.getItem("customerUserId");
    if (storedCustomerUserId) {
      setCustomerId(storedCustomerUserId.toString());
    } else {
      const storedCustomerUser = localStorage.getItem("customerUser");
      if (storedCustomerUser) {
        const customerData = JSON.parse(storedCustomerUser);
        if (customerData?.id) {
          setCustomerId(customerData.id.toString());
        }
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!customerId) return;

    const fetchVouchers = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE_URL}/api/CustomerVoucher/vouchers/customeruser/${customerId}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch vouchers: ${response.statusText}`);
        }

        const data = await response.json();
        setVouchers(data);
      } catch (err) {
        setError(err.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchVouchers();
  }, [customerId]);

  return (
    <>
      <Navbar disableFilters={ true } disableSearch={ true } />
      <div className="min-h-screen bg-gradient-to-b from-purple-50 via-indigo-100 to-white py-24 px-4 sm:px-8">
        <h1 className="text-4xl font-extrabold text-center text-indigo-700 mb-12 flex items-center justify-center gap-3">
          <Gift className="w-8 h-8 text-purple-600 animate-bounce" />
          My Vouchers
        </h1>

        { loading && <p className="text-center text-gray-500 text-lg">Loading vouchers...</p> }

        { error && (
          <div className="max-w-md mx-auto bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-center">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{ error }</span>
          </div>
        ) }

        { !loading && !error && vouchers.length === 0 && (
          <p className="text-center text-gray-600 text-lg">No vouchers found.</p>
        ) }

        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          { vouchers.map((voucher) => (
            <div
              key={ voucher.id }
              className="relative bg-white shadow-xl border border-gray-200 rounded-2xl p-6 transition transform hover:-translate-y-1 hover:shadow-purple-300"
            >
              {/* Discount Badge */ }
              <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-md">
                { voucher.discount_percent }% OFF
              </div>

              <div className="mb-4 mt-6">
                <h2 className="text-xl font-bold text-indigo-800 flex items-center gap-2">
                  <BadgePercent className="w-5 h-5 text-indigo-500" />
                  { voucher.code }
                </h2>
              </div>

              <ul className="text-sm text-gray-700 space-y-1 mb-3">
                <li>
                  <strong>Discount:</strong> { voucher.discount_percent }%
                </li>
                <li>
                  <strong>Valid:</strong>{ " " }
                  { new Date(voucher.valid_from).toLocaleDateString() } to{ " " }
                  { new Date(voucher.valid_to).toLocaleDateString() }
                </li>
                <li className="flex items-center gap-1">
                  <strong>Status:</strong>
                  { voucher.is_used ? (
                    <span className="text-red-600 font-semibold flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> Used
                    </span>
                  ) : (
                    <span className="text-green-600 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Not Used
                    </span>
                  ) }
                </li>
              </ul>

              <div className="mt-4 text-xs text-gray-400 italic flex items-center gap-1">
                <CalendarCheck2 className="w-4 h-4" />
                Created on { new Date(voucher.created_at).toLocaleString() }
              </div>
            </div>
          )) }
        </div>
      </div>
    </>
  );
};

export default CustomerUserVouchers;
