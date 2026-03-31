import React from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

const PrivacyPolicy = () => {
  return (
    <div id="PrivacyPolicy" className="bg-gray-50 min-h-screen flex flex-col">
      <Navbar />

      <div className="flex flex-col md:flex-row">
        {/* Side Navigation */}
        <div className="w-full md:w-1/4 bg-gray-100 p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">Table of Contents</h2>
          <ul className="space-y-2">
            <li>
              <a href="#introduction" className="text-blue-600 hover:text-blue-800">
                Introduction
              </a>
            </li>
            <li>
              <a href="#information-collection" className="text-blue-600 hover:text-blue-800">
                Information We Collect
              </a>
            </li>
            <li>
              <a href="#data-usage" className="text-blue-600 hover:text-blue-800">
                How We Use Your Information
              </a>
            </li>
            <li>
              <a href="#data-sharing" className="text-blue-600 hover:text-blue-800">
                Data Sharing and Disclosure
              </a>
            </li>
            <li>
              <a href="#security" className="text-blue-600 hover:text-blue-800">
                Data Security
              </a>
            </li>
            <li>
              <a href="#your-rights" className="text-blue-600 hover:text-blue-800">
                Your Rights and Choices
              </a>
            </li>
            <li>
              <a href="#cookies" className="text-blue-600 hover:text-blue-800">
                Cookies and Tracking
              </a>
            </li>
            <li>
              <a href="#third-party" className="text-blue-600 hover:text-blue-800">
                Third-Party Links
              </a>
            </li>
            <li>
              <a href="#updates" className="text-blue-600 hover:text-blue-800">
                Updates to This Policy
              </a>
            </li>
            <li>
              <a href="#contact" className="text-blue-600 hover:text-blue-800">
                Contact Us
              </a>
            </li>
          </ul>
        </div>

        {/* Main Content */}
        <div className="w-full md:w-3/4 p-6 space-y-8">
          <h1 className="text-3xl font-semibold text-gray-800">Privacy Policy</h1>

          <div id="introduction" className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">Introduction</h2>
            <p className="text-gray-700">
              MPlace is committed to protecting your privacy and ensuring transparency in how we collect, use, and safeguard your
              information. This Privacy Policy outlines our practices regarding data collection, usage, and protection when you
              access or use our platform. By using MPlace, you agree to the terms of this Privacy Policy. If you do not agree, please
              refrain from using our services.
            </p>
          </div>

          <div id="information-collection" className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">Information We Collect</h2>
            <p className="text-gray-700">
              We collect the following types of information to provide and improve our services:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Personal Information:</strong> Name, email address, phone number, and business details when you register on our platform.</li>
              <li><strong>Billing Information:</strong> Payment details for our paid services.</li>
              <li><strong>Non-Personal Information:</strong> Log data such as IP addresses, browser type, and device information.</li>
              <li><strong>Usage Data:</strong> Interactions with our platform, including page visits and time spent on the website.</li>
            </ul>
          </div>

          <div id="data-usage" className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">How We Use Your Information</h2>
            <p className="text-gray-700">
              We use the collected information for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>To facilitate connections between customers and suppliers.</li>
              <li>To process registrations and conduct due diligence.</li>
              <li>To provide customer support and respond to inquiries.</li>
              <li>To improve platform functionality and user experience.</li>
              <li>To process payments for optional services such as PO processing and supplier follow-ups.</li>
              <li>To comply with legal and regulatory obligations.</li>
            </ul>
          </div>

          <div id="data-sharing" className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">Data Sharing and Disclosure</h2>
            <p className="text-gray-700">
              MPlace does not sell, trade, or rent your personal information. However, we may share your information in the following cases:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>With verified suppliers and customers to facilitate transactions.</li>
              <li>With service providers for payment processing, security, or technical support.</li>
              <li>To comply with legal requirements if mandated by law, regulation, or legal processes.</li>
            </ul>
          </div>

          <div id="security" className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">Data Security</h2>
            <p className="text-gray-700">
              We implement appropriate security measures to protect your data from unauthorized access, alteration, or disclosure. However, while we strive to ensure data security, no online platform can guarantee absolute protection.
            </p>
          </div>

          <div id="your-rights" className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">Your Rights and Choices</h2>
            <p className="text-gray-700">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Access, correct, or update your personal information.</li>
              <li>Request deletion of your account and associated data.</li>
              <li>Opt-out of marketing communications at any time.</li>
            </ul>
            <p className="text-gray-700">To exercise these rights, contact us at  <a href="mailto:Info@teckost.com" className="text-blue-600 hover:text-blue-800">Info@teckost.com</a></p>
          </div>

          <div id="cookies" className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">Cookies and Tracking Technologies</h2>
            <p className="text-gray-700">
              MPlace uses cookies and similar technologies to enhance your experience. You can manage cookie preferences through your browser settings. Disabling cookies may impact certain features of the platform.
            </p>
          </div>

          <div id="third-party" className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">Third-Party Links</h2>
            <p className="text-gray-700">
              Our platform may contain links to third-party websites. MPlace is not responsible for the privacy practices of external sites. Users are encouraged to review third-party privacy policies before providing any personal information.
            </p>
          </div>

          <div id="updates" className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">Updates to This Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy periodically. Changes will be posted on this page, and continued use of our platform constitutes acceptance of the updated policy.
            </p>
          </div>

          <div id="contact" className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">Contact Us</h2>
            <p className="text-gray-700">
              For any questions or concerns regarding this Privacy Policy, please contact us at: <a href="mailto:Info@teckost.com" className="text-blue-600 hover:text-blue-800">Info@teckost.com</a>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
