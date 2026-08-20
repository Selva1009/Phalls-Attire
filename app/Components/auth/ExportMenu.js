"use client";

import { Download, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Swal from "sweetalert2";
import { exportToCSV, exportToExcel } from "@/lib/exportUtils";
import { format } from "date-fns";

const ExportMenu = ({ users = [], dataType = 'notifications' }) => {
  const handleExport = (type) => {
    if (!users || users.length === 0) {
      Swal.fire({
        title: "No Data",
        text: `There are no ${dataType} to export`,
        icon: "warning",
      });
      return;
    }

    let data;
    let fileName;

    if (dataType === 'users') {
      data = users.map(user => ({
        "Company Name": user.companyName || "",
        "Person Name": user.personName || "",
        "Contact Number": user.phoneNumber || user.contactNumber || " ",
        "Email": user.Email || "",
        "Status": user.status || "Active",
        "Created At": user.createdAt ? format(new Date(user.createdAt), "MMM dd, yyyy") : ""
      }));
      fileName = "users-list";
    } else if (dataType === 'products') {
      data = users.map(product => ({
        "Product Name": product.productName || "",
        "Brand": product.brand || "",
        "Category": product.category || "",
        "Seller": product.seller || "",
        "Price": product.price || ""
      }));
      fileName = "products-list";
    }
    else {
      // Default to notifications format
      data = users.map(notification => ({
        "User Name": notification.customerName || notification.personName || "",
        "Email": notification.Email || "",
        "Product": notification.productName || "",
        "Company": notification.companyName || "",
        "Price": notification.price || "",
        "Quantity": notification.quantity || "",
        "Date": notification.created_at
          ? format(new Date(notification.created_at), "MMM dd, yyyy HH:mm")
          : ""
      }));
      fileName = "notifications-list";
    }

    if (type === 'csv') {
      exportToCSV(data, fileName);
    } else {
      exportToExcel(data, fileName);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download size={16} />
          Export
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          CSV Format
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          Excel Format
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportMenu;
