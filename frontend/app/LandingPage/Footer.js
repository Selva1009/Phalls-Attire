"use client";
import Link from "next/link";
import { Linkedin, Mail, PhoneCall, Sparkles } from "lucide-react";
import { usePathname } from "next/navigation";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/supportContact";

export default function Footer() {
  const pathname = usePathname();
  const isLanding =
    pathname === "/" ||
    pathname === "/Home" ||
    pathname === "/About" ||
    pathname === "/customer/products" ||
    pathname === "/LandingPage";

  if (isLanding) {
    return (
      <footer className="w-10% bg-[#6a0f36] py-8 text-[#fbe8f1] sm:py-10 lg:py-12">
        <div className="mx-auto grid w-full max-w-[1600px] grid-cols-1 gap-8 px-4 text-center sm:px-6 md:grid-cols-3 md:gap-10 md:text-left lg:px-10 xl:gap-14 xl:px-16 2xl:px-28">
          <div className="flex flex-col items-center space-y-4 md:items-start">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 p-1 backdrop-blur sm:h-16 sm:w-16 lg:h-20 lg:w-20">
              <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white">
                <img
                  src="/Logo.png"
                  alt="MPlace Logo"
                  className="h-10 w-10 object-contain sm:h-12 sm:w-12 lg:h-16 lg:w-16"
                />
              </div>
            </div>
            <p className="max-w-xs text-xs font-medium text-[#f6cadc] sm:text-sm lg:text-base">
              Connecting businesses with trust and transparency.
              <br />
              Copyright {new Date().getFullYear()} MPlace. All Rights Reserved.
            </p>
          </div>

          <div className="flex flex-col items-center space-y-4 md:items-start">
            <h4 className="text-base font-semibold text-white sm:text-lg lg:text-xl">
              Legal & Policies
            </h4>
            <ul className="space-y-2 text-xs text-[#f6cadc] sm:text-sm lg:text-base">
              <li>
                <Link href="/policy" className="transition duration-200 hover:text-white">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal" className="transition duration-200 hover:text-white">
                  Legal Disclaimer
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex flex-col items-center space-y-4 md:items-end">
            <h4 className="text-base font-semibold text-white sm:text-lg lg:text-xl">
              Stay Connected
            </h4>
            <p className="max-w-xs text-xs text-[#f6cadc] sm:text-sm lg:text-base md:text-right">
              Follow us on LinkedIn for updates, insights, and more.
            </p>
            <div className="flex items-center justify-center md:justify-end">
              <a
                href="https://www.linkedin.com/company/teckost-it-services-pvt-ltd/posts/?feedView=all&viewAsMember=true"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/20 bg-white/10 p-3 text-[#fce3ee] transition duration-300 hover:scale-110 hover:bg-white hover:text-[#AD1457]"
              >
                <Linkedin className="h-5 w-5 sm:h-6 sm:w-6" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="w-full bg-[#0f1117] text-[#e6e7ef]">
      <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-10 px-4 py-12 text-center sm:px-6 sm:text-left md:grid-cols-2 md:py-14 lg:grid-cols-4 lg:gap-8 lg:px-10 xl:grid-cols-12 xl:gap-12 xl:px-16 2xl:px-24">
        <div className="xl:col-span-5">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#161a24] via-[#11141c] to-[#0b0d12] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffb3c7] text-[#3a0d1f]">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Phalls Studio</p>
                <p className="text-xs uppercase tracking-[0.3em] text-[#ffb3c7]">
                  Premium edit
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#c8c9d6]">
              Curated dress experiences with concierge‑level support. Tap into exclusive
              collections, faster fulfilment, and verified quality guarantees.
            </p>
          </div>
        </div>

        <div className="xl:col-span-3 md:text-left">
          <h4 className="text-lg font-semibold text-white">Quick Links</h4>
          <ul className="mt-4 space-y-3 text-sm text-[#c8c9d6]">
            <li>
              <Link href="/customer/favourites" className="transition hover:text-white">
                Wishlist
              </Link>
            </li>
            <li>
              <Link href="/customer/cart" className="transition hover:text-white">
                My Cart
              </Link>
            </li>
            <li>
              <Link href="/customer/orders" className="transition hover:text-white">
                Order History
              </Link>
            </li>
          </ul>
        </div>

        <div className="xl:col-span-2 text-left">
          <h4 className="text-lg font-semibold text-white">Support</h4>
          <div className="mt-4 space-y-2 text-sm text-[#c8c9d6]">
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-[#ffb3c7]" />
              <span className="min-w-0 break-words">{SUPPORT_EMAIL}</span>
            </div>
            <div className="flex items-start gap-2">
              <PhoneCall className="h-4 w-4 text-[#ffb3c7]" />
              <span className="min-w-0 break-words">{SUPPORT_PHONE}</span>
            </div>
            <p className="text-xs text-[#9b9db0]">9:00 AM – 9:00 PM IST</p>
          </div>
        </div>

        <div className="xl:col-span-2 md:text-left">
          <h4 className="text-lg font-semibold text-white">Connect</h4>
          <p className="mt-4 text-sm text-[#c8c9d6]">
            Follow our launch notes and buyer drops.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <a
              href="https://www.linkedin.com/company/teckost-it-services-pvt-ltd/posts/?feedView=all&viewAsMember=true"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-white/10 bg-[#1a1f2b] p-3 text-[#ffb3c7] transition duration-300 hover:scale-105 hover:border-[#ffb3c7]"
            >
              <Linkedin className="h-5 w-5" />
            </a>
            <span className="text-xs text-[#9b9db0]">LinkedIn updates</span>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 py-4 text-center text-xs text-[#9b9db0]">
        © {new Date().getFullYear()} Phalls. Made for modern wardrobes.
      </div>
    </footer>
  );
}
