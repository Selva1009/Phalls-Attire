"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Heart,
  Layers3,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Truck,
  User,
  X,
} from "lucide-react";

const highlights = [
  { value: "150+", label: "Curated collections" },
  { value: "40+", label: "Trusted suppliers" },
  { value: "4.9/5", label: "Premium experience score" },
];

const pillars = [
  {
    title: "Editorial Discovery",
    text: "A richer storefront that feels closer to a premium fashion brand than a standard marketplace grid.",
    icon: Sparkles,
  },
  {
    title: "Trust-Led Commerce",
    text: "Clear paths for buyers and vendors with cleaner structure, stronger hierarchy, and a more confident brand surface.",
    icon: ShieldCheck,
  },
  {
    title: "Feminine Premium Tone",
    text: "Soft luxury color balance, expressive typography, and a more magnetic emotional feel across the full journey.",
    icon: Heart,
  },
];

const floatingCards = [
  {
    title: "Curated Capsules",
    subtitle: "Premium marketplace edits",
    image: "/CordSet1 (21).jpeg",
  },
  {
    title: "Everyday Luxe",
    subtitle: "Modern silhouettes and polish",
    image: "/CordSet1 (24).jpeg",
  },
  {
    title: "Celebration Mood",
    subtitle: "Elevated festive storytelling",
    image: "/CordSet04.jpeg",
  },
];

const trustPoints = [
  "Customer and vendor onboarding with stronger visual trust",
  "Cleaner brand expression without changing existing business logic",
  "Responsive premium experience across landing, sign-in, and customer pages",
];

export default function LandingPage() {
  const [isSignupCardOpen, setSignupCardOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  return (
    <div className="landing-page">
      <header className="landing-navbar">
        <div className="landing-shell landing-nav-inner">
          <Link href="/" className="landing-brand">
            <div className="landing-logo-shell">
              <div className="landing-logo-core">
                <img src="/Logo.png" alt="Phalls logo" className="landing-logo-image" />
              </div>
            </div>
            <div>
              <p className="landing-brand-name">PHALLS</p>
              <p className="landing-brand-tag">Curated premium marketplace</p>
            </div>
          </Link>

          <nav className="landing-nav-links">
            <a href="#home">Home</a>
            <a href="#experience">Experience</a>
            <a href="#why">Why Phalls</a>
            <a href="#join">Join</a>
          </nav>

          <div className="landing-nav-actions">
            <button type="button" className="landing-button landing-button-secondary" onClick={() => setSignupCardOpen(true)}>
              Sign Up
            </button>
            <Link href="/SignIn" className="landing-button landing-button-primary">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main className="landing-main landing-shell">
        <section id="home" className="landing-hero">
          <div className="landing-hero-intro">
            <span className="landing-eyebrow">Luxury Marketplace Reimagined</span>
            <h1 className="landing-hero-title">
              A more magnetic landing page template built to feel premium, stylish, and unforgettable.
            </h1>
            <p className="landing-hero-text">
              This template shifts Phalls away from a conventional corporate feel into a richer branded experience with stronger mood, modern hierarchy, and more attractive storytelling.
            </p>

            <div className="landing-hero-actions">
              <Link href="/SignIn" className="landing-button landing-button-primary">
                Enter Marketplace
                <ArrowRight size={18} />
              </Link>
              <button type="button" className="landing-button landing-button-secondary" onClick={() => setSignupCardOpen(true)}>
                Join Phalls
              </button>
            </div>

            <div className="landing-highlight-row">
              {highlights.map((item) => (
                <div key={item.label} className="landing-surface-card landing-highlight-card">
                  <p className="landing-highlight-value">{item.value}</p>
                  <p className="landing-highlight-label">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="landing-hero-showcase">
            <div className="landing-showcase-frame">
              <div className="landing-showcase-backdrop" />
              <div className="landing-floating-card landing-card-primary">
                <img src={floatingCards[0].image} alt={floatingCards[0].title} className="landing-card-image" />
                <div className="landing-card-content">
                  <p>{floatingCards[0].subtitle}</p>
                  <h3>{floatingCards[0].title}</h3>
                </div>
              </div>
              <div className="landing-floating-card landing-card-secondary">
                <img src={floatingCards[1].image} alt={floatingCards[1].title} className="landing-card-image" />
                <div className="landing-card-content">
                  <p>{floatingCards[1].subtitle}</p>
                  <h3>{floatingCards[1].title}</h3>
                </div>
              </div>
              <div className="landing-floating-card landing-card-accent">
                <img src={floatingCards[2].image} alt={floatingCards[2].title} className="landing-card-image" />
                <div className="landing-card-content">
                  <p>{floatingCards[2].subtitle}</p>
                  <h3>{floatingCards[2].title}</h3>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="experience" className="landing-section">
          <div className="landing-section-lead">
            <span className="landing-eyebrow">Experience</span>
            <h2 className="landing-section-title">
              A template with more shape, contrast, and visual drama.
            </h2>
            <p className="landing-section-text">
              Instead of a standard hero and plain cards, this version uses layered panels, floating product moments, and stronger composition to make the first impression feel far more intentional.
            </p>
          </div>

          <div className="landing-pillar-grid">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <article key={pillar.title} className="landing-surface-card landing-pillar-card">
                  <div className="landing-icon-chip">
                    <Icon size={20} />
                  </div>
                  <h3>{pillar.title}</h3>
                  <p>{pillar.text}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="why" className="landing-story-section">
          <div className="landing-story-visual">
            <div className="landing-story-panel">
              <div className="landing-story-badge">
                <Layers3 size={16} />
                Brand Direction
              </div>
              <h2>Soft luxury, stronger depth, cleaner intent.</h2>
              <p>
                The landing page now creates atmosphere before the user even signs in. Typography, panel layering, and image rhythm all work together to make the platform feel more premium.
              </p>
            </div>
          </div>

          <div className="landing-story-content">
            <span className="landing-eyebrow">Why Phalls</span>
            <h2 className="landing-section-title">
              Better looking pages create stronger trust before action.
            </h2>
            <div className="landing-trust-list">
              {trustPoints.map((point) => (
                <div key={point} className="landing-trust-item">
                  <Check size={18} />
                  <span>{point}</span>
                </div>
              ))}
            </div>

            {/* <div className="landing-join-cards">
              <div className="landing-surface-card landing-join-card">
                <User size={20} />
                <h3>Customer</h3>
                <p>Browse products through a softer, more elegant marketplace surface.</p>
              </div>
              <div className="landing-surface-card landing-join-card">
                <Store size={20} />
                <h3>Vendor</h3>
                <p>Onboard into a cleaner ecosystem with stronger premium cues.</p>
              </div>
              <div className="landing-surface-card landing-join-card">
                <Truck size={20} />
                <h3>Operational Flow</h3>
                <p>Keep the same functional workflow while improving perceived value.</p>
              </div>
            </div> */}
          </div>
        </section>

        <section id="join" className="landing-section">
          <div className="landing-surface-card landing-cta-card">
            <span className="landing-eyebrow">Join The Experience</span>
            <h2 className="landing-section-title">
              Enter a marketplace that now feels more premium from the first scroll.
            </h2>
            <p className="landing-section-text">
              Choose your access path and continue into the same platform through a stronger front-door experience.
            </p>
            <div className="landing-hero-actions landing-cta-actions">
              <button type="button" className="landing-button landing-button-primary" onClick={() => setSignupCardOpen(true)}>
                Sign Up
                <ArrowRight size={18} />
              </button>
              <Link href="/SignIn" className="landing-button landing-button-secondary">
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer landing-shell">
        <div className="landing-footer-inner">
          <div>
            <p className="landing-footer-label">Phalls</p>
            <h2 className="landing-footer-title">
              More attractive, more premium, and more aligned with a modern marketplace brand.
            </h2>
          </div>
          <div className="landing-footer-links">
            <a href="#home">Home</a>
            <a href="#experience">Experience</a>
            <a href="#why">Why Phalls</a>
            <Link href="/SignIn">Sign In</Link>
          </div>
        </div>
      </footer>

      {isSignupCardOpen && (
        <div className="landing-modal-backdrop" onClick={() => setSignupCardOpen(false)}>
          <div className="landing-surface-card landing-modal-card" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="landing-modal-close"
              onClick={() => {
                setSignupCardOpen(false);
                setSelectedRole(null);
              }}
            >
              <X size={18} />
            </button>

            <span className="landing-eyebrow">Join Us</span>
            <h2 className="landing-modal-title">Choose how you&apos;d like to join Phalls</h2>

            <button
              type="button"
              className={`landing-role-card ${selectedRole === "Customer" ? "landing-role-active" : ""}`}
              onClick={() => setSelectedRole("Customer")}
            >
              <div className="landing-icon-chip"><User size={18} /></div>
              <div>
                <h3>Customer</h3>
                <p>Discover curated products and an elevated shopping flow.</p>
              </div>
            </button>

            <button
              type="button"
              className={`landing-role-card ${selectedRole === "Vendor" ? "landing-role-active" : ""}`}
              onClick={() => setSelectedRole("Vendor")}
            >
              <div className="landing-icon-chip"><Store size={18} /></div>
              <div>
                <h3>Vendor</h3>
                <p>Grow on a more polished and trust-led marketplace surface.</p>
              </div>
            </button>

            <Link
              href={selectedRole === "Vendor" ? "/vendor-signup" : "/customer-signup"}
              className={`landing-button landing-button-primary landing-modal-action ${!selectedRole ? "landing-disabled-button" : ""}`}
              onClick={(e) => {
                if (!selectedRole) e.preventDefault();
              }}
            >
              Continue
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
