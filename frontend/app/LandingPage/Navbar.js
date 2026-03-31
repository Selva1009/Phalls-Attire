"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  X,
  User,
  Store,
  Check,
  ArrowRight,
  Home,
  Settings,
  Mail,
  Sparkles,
} from "lucide-react";
import { RiMenuUnfold2Fill } from "react-icons/ri";

export default function Navbar() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSignupCardOpen, setSignupCardOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [activeLink, setActiveLink] = useState("");
  const router = useRouter();

  const handleLinkClick = (link) => {
    setActiveLink(link);
    if (isSidebarOpen) {
      setSidebarOpen(false);
    }
  };

  const openSignupCard = () => setSignupCardOpen(true);
  const closeSignupCard = () => {
    setSignupCardOpen(false);
    setSelectedRole(null);
  };

  const handleContinue = () => {
    if (selectedRole === "Customer") {
      router.push("/customer-signup");
    } else if (selectedRole === "Vendor") {
      router.push("/vendor-signup");
    }
  };

  const navItems = [
    {
      name: "Home",
      icon: <Home className="h-4 w-4 sm:h-5 sm:w-5" />,
    },
    {
      name: "services",
      icon: <Settings className="h-4 w-4 sm:h-5 sm:w-5" />,
    },
    {
      name: "ContactSection",
      icon: <Mail className="h-4 w-4 sm:h-5 sm:w-5" />,
    },
  ];

  return (
    <>
      <div className="sticky top-0 z-50 border-b border-[#f3cade] bg-[rgba(255,255,255,0.88)] backdrop-blur-xl premium-shadow">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-16 2xl:px-20">
          <div className="flex h-16 items-center justify-between sm:h-20">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E91E63] to-[#AD1457] p-[2px] premium-shadow sm:h-12 sm:w-12 md:h-14 md:w-14">
                <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white">
                  <img
                    src="/Logo.png"
                    alt="M-Place Logo"
                    className="h-7 w-7 object-contain sm:h-9 sm:w-9 md:h-10 md:w-10"
                  />
                </div>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#AD1457]">
                  M-Place
                </p>
                <p className="text-xs text-[#7a5b6b]">
                  Premium marketplace experience
                </p>
              </div>
            </div>

            <div className="hidden items-center space-x-4 sm:flex md:space-x-6 lg:space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.name === "Home" ? "/" : `/#${item.name}`}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 hover:bg-[#fde8ef] hover:text-[#E91E63] ${
                    activeLink === item.name ? "bg-[#fde8ef] text-[#E91E63]" : "text-[#4b3741]"
                  }`}
                  onClick={() => handleLinkClick(item.name)}
                >
                  <span className="hidden sm:inline-block">{item.icon}</span>
                  {item.name === "Home"
                    ? "Home"
                    : item.name === "services"
                      ? "Services"
                      : "Contact Us"}
                </Link>
              ))}
              <button
                className="rounded-full border border-[#f6bad2] bg-white px-5 py-2.5 text-xs font-semibold tracking-[0.2em] text-[#AD1457] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#E91E63] hover:bg-[#fff0f5] md:text-sm"
                onClick={openSignupCard}
              >
                SIGN UP
              </button>
              <Link href="/SignIn">
                <button className="rounded-full px-5 py-2.5 text-xs font-semibold tracking-[0.2em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] md:text-sm magenta-gradient premium-shadow">
                  SIGN IN
                </button>
              </Link>
            </div>

            <div className="sm:hidden flex items-center">
              <button
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className="rounded-xl p-2 text-[#AD1457] transition-colors hover:bg-[#fde8ef] focus:outline-none focus:ring-2 focus:ring-[#E91E63]"
                aria-label="Toggle menu"
              >
                {isSidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <RiMenuUnfold2Fill className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 sm:hidden">
            <div
              className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />

            <div className="absolute right-0 top-0 h-full w-64 bg-[#fff7fa] premium-shadow-strong transition-transform duration-300 ease-in-out sm:w-72">
              <div className="border-b border-[#f4cada] p-4 sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#AD1457]">
                  Navigation
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-lg font-semibold text-[#2E2E2E]">M-Place</p>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="rounded-full p-1.5 transition-colors hover:bg-white"
                  >
                    <X className="h-5 w-5 text-[#AD1457]" />
                  </button>
                </div>
              </div>

              <nav className="space-y-3 p-4 sm:p-5">
                {navItems.map(({ name, icon }) => (
                  <Link
                    key={name}
                    href={name === "Home" ? "/" : `/#${name}`}
                    className={`flex items-center space-x-3 rounded-lg p-3 transition-colors ${
                      activeLink === name
                        ? "bg-white text-[#E91E63] premium-shadow"
                        : "text-[#4b3741] hover:bg-white"
                    }`}
                    onClick={() => handleLinkClick(name)}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        activeLink === name ? "bg-[#fde8ef]" : "bg-white"
                      }`}
                    >
                      {icon}
                    </div>
                    <span className="font-medium text-sm sm:text-base">
                      {name === "Home" ? "Home" : name === "services" ? "Services" : "Contact"}
                    </span>
                  </Link>
                ))}
              </nav>

              <div className="absolute bottom-0 left-0 right-0 border-t border-[#f4cada] bg-[#fff7fa] p-4 sm:p-5">
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      openSignupCard();
                      setSidebarOpen(false);
                    }}
                    className="w-full rounded-2xl border border-[#f4cada] bg-white px-4 py-3 text-sm font-medium text-[#AD1457] transition duration-300 hover:bg-[#fde8ef]"
                  >
                    Sign Up
                  </button>
                  <Link href="/SignIn" className="block w-full">
                    <button
                      className="w-full rounded-2xl px-4 py-3 text-sm font-medium text-white transition duration-300 hover:scale-[1.01] magenta-gradient premium-shadow"
                      onClick={() => setSidebarOpen(false)}
                    >
                      Sign In
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {isSignupCardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-4 backdrop-blur-sm">
          <div
            className="relative w-full max-w-xs overflow-hidden rounded-[28px] border border-[#f3cade] bg-white shadow-2xl sm:max-w-sm md:max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeSignupCard}
              className="absolute right-3 top-3 z-10 rounded-full bg-white p-1.5 shadow-md transition hover:bg-[#fff0f5] sm:right-4 sm:top-4 sm:p-2"
            >
              <X className="h-4 w-4 text-[#AD1457] sm:h-5 sm:w-5" />
            </button>

            <div className="relative">
              <div className="absolute inset-0 magenta-gradient opacity-10" />
              <div className="relative p-6 text-center sm:p-7 md:p-8">
                <div className="mb-3 inline-flex rounded-full border border-[#f3cade] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#AD1457]">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Join Us
                </div>
                <h2 className="mb-1 text-xl font-bold text-[#2E2E2E] sm:text-2xl md:text-3xl">
                  Welcome!
                </h2>
                <p className="text-xs text-[#7a5b6b] sm:text-sm md:text-base">
                  Choose how you&apos;d like to join us
                </p>
              </div>
            </div>

            <div className="px-5 pb-6 sm:px-6 sm:pb-7 md:px-8 md:pb-8">
              <div className="mt-2 grid gap-4 sm:mt-3 sm:gap-5 md:mt-4 md:gap-6">
                <div
                  className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-4 transition-all duration-300 sm:p-5 md:p-6 ${
                    selectedRole === "Customer"
                      ? "border-[#E91E63] bg-white shadow-lg ring-2 ring-[#E91E63]"
                      : "border-[#f5d4e2] bg-[#fff6fa] hover:shadow-md"
                  }`}
                  onClick={() => setSelectedRole("Customer")}
                >
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div
                      className={`rounded-lg p-2 sm:p-3 ${
                        selectedRole === "Customer"
                          ? "bg-[#fde8ef] text-[#E91E63]"
                          : "bg-white text-[#7a5b6b] group-hover:bg-[#fff0f5]"
                      }`}
                    >
                      <User className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-[#2E2E2E] sm:text-base md:text-[1.05rem]">
                        Customer
                      </h3>
                      <p className="mt-1 text-xs text-[#7a5b6b] sm:text-sm">
                        Discover amazing products tailored for you
                      </p>
                    </div>
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        selectedRole === "Customer"
                          ? "border-[#E91E63] bg-[#E91E63]"
                          : "border-[#d8a9bd] group-hover:border-[#E91E63]"
                      }`}
                    >
                      {selectedRole === "Customer" && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-4 transition-all duration-300 sm:p-5 md:p-6 ${
                    selectedRole === "Vendor"
                      ? "border-[#AD1457] bg-white shadow-lg ring-2 ring-[#AD1457]"
                      : "border-[#f5d4e2] bg-[#fff6fa] hover:shadow-md"
                  }`}
                  onClick={() => setSelectedRole("Vendor")}
                >
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div
                      className={`rounded-lg p-2 sm:p-3 ${
                        selectedRole === "Vendor"
                          ? "bg-[#f9dbe8] text-[#AD1457]"
                          : "bg-white text-[#7a5b6b] group-hover:bg-[#fff0f5]"
                      }`}
                    >
                      <Store className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-[#2E2E2E] sm:text-base md:text-[1.05rem]">
                        Vendor
                      </h3>
                      <p className="mt-1 text-xs text-[#7a5b6b] sm:text-sm">
                        Grow your business with our marketplace
                      </p>
                    </div>
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        selectedRole === "Vendor"
                          ? "border-[#AD1457] bg-[#AD1457]"
                          : "border-[#d8a9bd] group-hover:border-[#AD1457]"
                      }`}
                    >
                      {selectedRole === "Vendor" && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button
                className={`mt-6 flex w-full items-center justify-center rounded-2xl py-3 font-medium text-white transition-all duration-300 sm:mt-7 md:mt-8 md:py-4 ${
                  selectedRole
                    ? "magenta-gradient shadow-lg hover:scale-[1.01] hover:shadow-xl"
                    : "cursor-not-allowed bg-gray-300"
                }`}
                disabled={!selectedRole}
                onClick={handleContinue}
              >
                <span className="flex items-center text-sm md:text-base">
                  Continue as {selectedRole || "..."}
                  <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
