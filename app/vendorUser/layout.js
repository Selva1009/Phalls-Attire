"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardLayout from "@/app/Components/DashboardLayout";

export default function VendorDashboardLayout({ children }) {
  const router = useRouter();
  const [vendorUserId, setVendorUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedVendorUser = localStorage.getItem("vendorUser");

    if (!storedVendorUser) {
      console.warn("Vendor user not found in localStorage. Redirecting to SignIn...");
      router.replace("/Home");
      return;
    }

    const parsedVendorUser = JSON.parse(storedVendorUser);
    setVendorUserId(parsedVendorUser.id); // or parsedVendorUser.vendorId if you store that separately
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return <p className="text-center text-gray-600 mt-10">Loading...</p>;
  }

  return <DashboardLayout id={vendorUserId}>{children}</DashboardLayout>;
}

