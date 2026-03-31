"use client";
import { API_BASE_URL } from "@/lib/api";
import { useState } from "react";
import { Mail, Phone, MapPin, User, MessageSquare } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Swal from "sweetalert2";
import { motion } from "framer-motion";

export default function ContactSection() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/contact/contactus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        showSuccessAlert();
        reset();
      } else {
        showErrorAlert(result.message);
      }
    } catch (error) {
      showErrorAlert("Please try again later.");
    }

    setLoading(false);
  };

  const showSuccessAlert = () => {
    Swal.fire({
      title: "Message Sent!",
      text: "We will get back to you within 24 hours",
      icon: "success",
      confirmButtonText: "Great!",
      customClass: {
        container: "rounded-xl",
        popup: "rounded-2xl border border-gray-200 shadow-2xl",
        confirmButton:
          "bg-gradient-to-r from-[#E91E63] to-[#AD1457] hover:from-[#d81b60] hover:to-[#8d1047] px-6 py-2 rounded-full text-white",
      },
      background: "#fff",
    });
  };

  const showErrorAlert = (message) => {
    Swal.fire({
      icon: "error",
      title: "Oops!",
      text: message,
      confirmButtonText: "Try Again",
      confirmButtonColor: "#E91E63",
    });
  };

  return (
    <section
      id="ContactSection"
      className="bg-[linear-gradient(180deg,#fff0f5_0%,#fff8fb_100%)] px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="mb-16 text-center"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-[#AD1457]">
            Contact Concierge
          </p>
          <h2 className="mb-4 text-4xl font-bold text-[#2E2E2E]">
            Get in Touch
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-[#5d4751]">
            Have questions or want to discuss a project? Reach out to our team and we&apos;re here to help.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="space-y-8">
              <div className="rounded-[26px] border border-[#f3cade] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(173,20,87,0.14)]">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-[#fde8ef] p-3 text-[#E91E63]">
                    <Mail size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#2E2E2E]">
                      Email Us
                    </h3>
                    <p className="mt-1 text-[#5d4751]">info@teckost.com</p>
                    <a
                      href="mailto:info@teckost.com"
                      className="mt-2 inline-block text-sm font-medium text-[#E91E63] hover:text-[#AD1457]"
                    >
                      Send us an email
                    </a>
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] border border-[#f3cade] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(173,20,87,0.14)]">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-[#fce4ec] p-3 text-[#AD1457]">
                    <Phone size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#2E2E2E]">
                      Call Us
                    </h3>
                    <p className="mt-1 text-[#5d4751]">(044) 477-03399</p>
                    <a
                      href="tel:+04447703399"
                      className="mt-2 inline-block text-sm font-medium text-[#E91E63] hover:text-[#AD1457]"
                    >
                      Call now
                    </a>
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] border border-[#f3cade] bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(173,20,87,0.14)]">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-[#f4e4f8] p-3 text-[#AD1457]">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#2E2E2E]">
                      Visit Us
                    </h3>
                    <p className="mt-1 text-[#5d4751]">
                      53, North Boag Road, Fourth Floor, Mandira Block B,
                      <br />
                      Behind Residency Towers,
                      <br />
                      Chennai, Tamil Nadu 600017
                    </p>
                    <a
                      href="https://maps.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm font-medium text-[#E91E63] hover:text-[#AD1457]"
                    >
                      Get directions
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="rounded-[32px] border border-[#f3cade] bg-white p-8 shadow-[0_22px_60px_rgba(173,20,87,0.12)]"
          >
            <h3 className="mb-2 text-2xl font-bold text-[#2E2E2E]">
              Send us a message
            </h3>
            <p className="mb-6 text-[#5d4751]">
              Fill out the form below and we&apos;ll get back to you soon
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-[#4b3741]">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <User className="h-5 w-5 text-[#c07a99]" />
                  </div>
                  <Input
                    id="name"
                    type="text"
                    {...register("name", { required: "Name is required" })}
                    className="w-full rounded-2xl border border-[#efc8d8] py-3 pl-10 focus:border-[#E91E63] focus:ring-2 focus:ring-[#f8bbd0]"
                    placeholder="John Doe"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#4b3741]">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Mail className="h-5 w-5 text-[#c07a99]" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address",
                      },
                    })}
                    className="w-full rounded-2xl border border-[#efc8d8] py-3 pl-10 focus:border-[#E91E63] focus:ring-2 focus:ring-[#f8bbd0]"
                    placeholder="your@email.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="comment" className="mb-2 block text-sm font-medium text-[#4b3741]">
                  Your Message <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-3">
                    <MessageSquare className="h-5 w-5 text-[#c07a99]" />
                  </div>
                  <Textarea
                    id="comment"
                    {...register("comment", {
                      required: "Message is required",
                      minLength: {
                        value: 10,
                        message: "Message must be at least 10 characters",
                      },
                    })}
                    className="min-h-[130px] w-full rounded-2xl border border-[#efc8d8] py-3 pl-10 focus:border-[#E91E63] focus:ring-2 focus:ring-[#f8bbd0]"
                    placeholder="How can we help you?"
                  />
                </div>
                {errors.comment && (
                  <p className="mt-1 text-sm text-red-600">{errors.comment.message}</p>
                )}
              </div>

              <div className="flex justify-center pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 rounded-full px-6 py-3 font-medium text-white transition-all duration-300 hover:scale-[1.02] magenta-gradient premium-shadow"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    "Send Message"
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
