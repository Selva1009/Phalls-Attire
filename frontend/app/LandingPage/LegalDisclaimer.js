import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

const LegalDisclaimer = () => {
  return (
    <div className="min-h-screen flex flex-col" id="LegalDisclaimer">
      <Navbar />
      <main className="flex-grow px-6 py-12 max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          Legal Disclaimer
        </h1>

        <section className="text-gray-700">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              General Information
            </h2>
            <p className="text-lg leading-relaxed">
              MPlace is a digital platform that connects customers and suppliers. We facilitate interaction, but we do not participate in monetary transactions, price adjustments, or revenue generation through product exchanges between customers and suppliers.
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Scope of Services
            </h2>
            <p className="text-lg leading-relaxed">
              MPlace provides customers with the ability to engage directly with suppliers for placing orders and making payments. Additionally, we offer services like purchase order processing and follow-ups for deliveries. These services are available for a fee and are intended to provide added convenience. MPlace assumes no liability for transactions conducted directly between customers and suppliers outside our service scope.
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              No Commercial Intermediation
            </h2>
            <p className="text-lg leading-relaxed">
              MPlace does not serve as an intermediary in financial transactions or contractual obligations between customers and suppliers. All financial arrangements, including payments, delivery, and product-related obligations, are solely between the involved parties. MPlace is not liable for product quality, pricing issues, delivery delays, or any disputes arising from these transactions.
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Due Diligence & Registration
            </h2>
            <p className="text-lg leading-relaxed">
              MPlace performs due diligence on both customers and suppliers during the onboarding process to maintain trust and transparency. A nominal, non-refundable registration fee of ₹1,000 is charged to cover verification costs. This fee is not an endorsement or guarantee of the future conduct of transactions between the parties.
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Limitation of Liability
            </h2>
            <p className="text-lg leading-relaxed">
              MPlace shall not be liable for any direct, indirect, incidental, or consequential damages arising from the use of our platform. This includes financial loss, disputes with suppliers, non-fulfillment of orders, delivery delays, or product quality issues. It is the responsibility of users to perform their own due diligence before entering any transaction.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Amendments
            </h2>
            <p className="text-lg leading-relaxed">
              MPlace reserves the right to modify, amend, or update this disclaimer at any time, without prior notice. Users are advised to review this document periodically to stay informed of any changes. Continued use of the platform after modifications constitute acceptance of the updated terms.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default LegalDisclaimer;
