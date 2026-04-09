import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Star } from "lucide-react";

export default function Home() {
  return (
    <section
      id="Home"
      className="relative overflow-hidden bg-[linear-gradient(135deg,#fff0f5_0%,#f8bbd0_38%,#e1bee7_100%)] px-6 py-14 sm:px-8 md:px-12 lg:px-16 lg:py-20 xl:px-24 2xl:px-32"
    >
      <div className="absolute inset-0">
        <div className="absolute -left-16 top-10 h-48 w-48 rounded-full bg-white/30 blur-3xl sm:h-72 sm:w-72" />
        <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-[#E91E63]/20 blur-3xl sm:h-80 sm:w-80" />
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-12 xl:gap-16 2xl:gap-20">
        <div className="order-2 flex flex-col justify-center text-center md:order-1 md:text-left">
          <div className="mb-5 inline-flex w-fit self-center rounded-full border border-white/70 bg-white/55 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-[#AD1457] premium-shadow md:self-start">
            <Sparkles className="mr-2 h-4 w-4" />
            Curated Marketplace
          </div>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-[#2E2E2E] sm:text-5xl xl:text-6xl">
            Shop a premium magenta experience with confidence and style.
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-[#5c4650] sm:text-base xl:text-lg">
            Phalls now feels refined, elegant, and emotionally rich while keeping the same trusted platform underneath. Explore curated collections, thoughtful onboarding, and elevated shopping flows built to convert.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center md:justify-start">
            <Link
              href="/Home"
              className="inline-flex items-center justify-center rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.03] premium-shadow magenta-gradient"
            >
              Explore Marketplace
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <a
              href="#services"
              className="inline-flex items-center justify-center rounded-full border border-white/70 bg-white/70 px-7 py-3.5 text-sm font-semibold text-[#AD1457] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white"
            >
              Discover Services
            </a>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { label: "Curated Looks", value: "120+" },
              { label: "Premium Journey", value: "24/7" },
              { label: "Verified Flow", value: "100%" },
            ].map((item) => (
              <div key={item.label} className="rounded-[22px] border border-white/60 bg-white/60 p-4 premium-shadow backdrop-blur">
                <p className="text-2xl font-bold text-[#AD1457]">{item.value}</p>
                <p className="mt-1 text-sm text-[#6a505b]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="order-1 flex justify-center md:order-2">
          <div className="relative h-[360px] w-full max-w-md overflow-hidden rounded-[30px] border border-white/50 premium-shadow-strong sm:h-[430px] sm:max-w-lg lg:h-[520px]">
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#2e1120]/45 via-transparent to-transparent" />
            <Image
              src="/CordSet1.jpeg"
              alt="Premium collection"
              fill
              priority
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute left-5 top-5 z-20 rounded-2xl bg-white/85 p-4 backdrop-blur premium-shadow">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#AD1457]">
                Featured Edit
              </p>
              <div className="mt-2 flex items-center gap-2 text-[#D4AF37]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-2 max-w-[180px] text-sm text-[#5c4650]">
                A rich, feminine storefront crafted to feel elevated and modern.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

