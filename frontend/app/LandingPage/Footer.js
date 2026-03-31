"use client";
import Link from "next/link";
import { Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-[#6a0f36] py-10 text-[#fbe8f1] sm:py-12 lg:py-14">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 gap-8 px-6 text-center sm:grid-cols-2 sm:px-8 sm:text-left md:px-12 lg:grid-cols-3 lg:gap-14 lg:px-16 xl:gap-16 xl:px-20 2xl:gap-20 2xl:px-40">
        <div className="flex flex-col items-center space-y-4 sm:items-start xl:space-y-6">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 p-1 backdrop-blur sm:h-20 sm:w-20 2xl:h-24 2xl:w-24">
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white">
              <img
                src="/Logo.png"
                alt="MPlace Logo"
                className="h-12 w-12 object-contain sm:h-16 sm:w-16 2xl:h-20 2xl:w-20"
              />
            </div>
          </div>
          <p className="text-center text-xs font-medium text-[#f6cadc] sm:text-left sm:text-sm xl:text-base">
            Connecting businesses with trust and transparency.
            <br />
            Copyright {new Date().getFullYear()} MPlace. All Rights Reserved.
          </p>
        </div>

        <div className="flex flex-col items-center space-y-4 sm:items-start 2xl:space-y-7">
          <h4 className="text-lg font-semibold text-white sm:text-xl xl:text-2xl">
            Legal & Policies
          </h4>
          <ul className="space-y-2 text-xs text-[#f6cadc] sm:text-sm xl:text-base">
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

        <div className="flex flex-col items-center space-y-5 sm:items-end xl:space-y-7">
          <h4 className="text-lg font-semibold text-white sm:text-xl xl:text-2xl">
            Stay Connected
          </h4>
          <p className="text-center text-xs text-[#f6cadc] sm:text-right sm:text-sm xl:text-base">
            Follow us on LinkedIn for updates, insights, and more.
          </p>
          <div className="flex space-x-4">
            <a
              href="https://www.linkedin.com/company/teckost-it-services-pvt-ltd/posts/?feedView=all&viewAsMember=true"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/20 bg-white/10 p-3 text-[#fce3ee] transition duration-300 hover:scale-110 hover:bg-white hover:text-[#AD1457]"
            >
              <Linkedin className="h-6 w-6 sm:h-7 sm:w-7" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
