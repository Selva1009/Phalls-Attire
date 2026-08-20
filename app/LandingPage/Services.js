import React from "react";
import { Heart, ShieldCheck, Sparkles, Star } from "lucide-react";

const servicesData = [
  {
    title: "Platform for Seamless Connections",
    description:
      "MPlace serves as a platform connecting customers and suppliers without any monetary benefits. However, if clients opt for our services to facilitate purchase order (PO) processing and supplier follow-ups for deliveries, a service fee applies.",
    icon: Sparkles,
  },
  {
    title: "Direct Transactions with Transparency",
    description:
      "Otherwise, customers are responsible for placing orders and making payments directly to suppliers, with no contractual obligation to our company, as we do not engage in trading or add margins to generate revenue.",
    icon: Heart,
  },
  {
    title: "Ensuring Trust and Credibility",
    description:
      "To ensure trust and credibility, we conduct due diligence on both customers and suppliers during onboarding, requiring a nominal registration fee of Rs. 1,000 for validation.",
    icon: ShieldCheck,
  },
];

const Services = () => {
  return (
    <section
      className="bg-[linear-gradient(180deg,#fff8fb_0%,#fff0f5_50%,#fbe4f1_100%)] px-6 py-14 sm:px-8 sm:py-16 lg:px-16 lg:py-20 xl:px-20 2xl:px-32"
      id="services"
    >
      <div className="mb-10 text-center md:mb-12 lg:mb-14">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.38em] text-[#AD1457]">
          Signature Services
        </p>
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#2E2E2E] sm:text-4xl lg:text-5xl xl:text-[3.5rem] 2xl:text-6xl">
          A polished experience built for trust-first commerce.
        </h1>
        <p className="mx-auto mt-4 max-w-3xl text-base tracking-tight text-[#5d4751] sm:text-lg md:text-xl xl:text-2xl">
          Connecting customers and suppliers with elegance, efficiency, and a premium service layer.
        </p>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 md:gap-10 lg:grid-cols-3 lg:gap-8 xl:gap-10 2xl:gap-12">
        {servicesData.map((service, index) => (
          <article
            key={index}
            className="group rounded-[26px] border border-[#f4cada] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,240,245,0.92))] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(173,20,87,0.14)] sm:p-7 md:p-8 lg:p-7 xl:p-8 2xl:p-10"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fde8ef] text-[#E91E63] transition-transform duration-300 group-hover:scale-110">
              <service.icon className="h-6 w-6" />
            </div>
            <h3 className="mb-3 text-xl font-semibold tracking-tight text-[#AD1457] sm:text-2xl md:text-[1.35rem] lg:text-2xl xl:text-[1.75rem] 2xl:text-3xl">
              {service.title}
            </h3>
            <p className="text-sm tracking-tight text-[#5d4751] sm:text-base md:text-[0.95rem] lg:text-base xl:text-lg 2xl:text-xl">
              {service.description}
            </p>
          </article>
        ))}
      </div>

      <div className="mx-auto mt-14 max-w-6xl rounded-[30px] border border-[#f3cade] bg-white/75 p-8 text-center premium-shadow sm:p-10 lg:mt-18">
        <div className="mb-4 flex justify-center gap-2 text-[#D4AF37]">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className="h-5 w-5 fill-current" />
          ))}
        </div>
        <h3 className="mb-3 text-2xl font-semibold tracking-tight text-[#2E2E2E] sm:text-3xl xl:text-4xl">
          Ready to get started?
        </h3>
        <p className="mb-6 text-base tracking-tight text-[#5d4751] sm:text-lg xl:text-2xl">
          Let us guide the process and help you build a lasting business relationship with a premium service touch.
        </p>
        <a
          href="#ContactSection"
          className="inline-flex rounded-full px-8 py-3.5 text-base font-semibold text-white transition-all duration-300 hover:scale-105 premium-shadow magenta-gradient sm:px-10 xl:px-12 xl:text-xl"
        >
          Contact Us Now
        </a>
      </div>
    </section>
  );
};

export default Services;
