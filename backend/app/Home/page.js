import ProductsPage from "../customer/products/page";
import CustomerLayout from "../customer/layout";

export default function HomePage() {
  return (
    <CustomerLayout>
      <ProductsPage />
    </CustomerLayout>
  );
}
