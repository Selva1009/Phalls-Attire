"use client";

import { useEffect, useState } from "react";

const signInSlides = [
  "https://images.pexels.com/photos/13530383/pexels-photo-13530383.jpeg?cs=srgb&dl=pexels-dress-on-mannequin-13530383.jpg&fm=jpg",
  "https://images.pexels.com/photos/36409025/pexels-photo-36409025.jpeg?cs=srgb&dl=pexels-valentin-ivantsov-36409025.jpg&fm=jpg",
  "https://images.pexels.com/photos/15791203/pexels-photo-15791203.jpeg?cs=srgb&dl=pexels-eugenia-remark-15791203.jpg&fm=jpg",
  "https://images.pexels.com/photos/5442250/pexels-photo-5442250.jpeg?cs=srgb&dl=pexels-chic-by-dzii-1671121-5442250.jpg&fm=jpg",
  "https://images.pexels.com/photos/32114770/pexels-photo-32114770.jpeg?cs=srgb&dl=pexels-jose-jimenez-32114770.jpg&fm=jpg",
];

export default function ImageSlider() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % signInSlides.length);
    }, 3200);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="signin-left">
      <div className="signin-left-slides">
        {signInSlides.map((slide, index) => (
          <img
            key={slide}
            src={slide}
            alt={`Fashion editorial ${index + 1}`}
            className={`signin-left-image ${
              index === activeSlide ? "signin-left-image-active" : ""
            }`}
          />
        ))}
      </div>
      <div className="signin-left-overlay" />
      <div className="signin-left-content">
        <h1>Luxury Dressing, Refined.</h1>
        <p>Discover premium silhouettes, occasion edits, and elevated essentials.</p>
      </div>
      <div className="signin-left-dots">
        {signInSlides.map((slide, index) => (
          <button
            key={`${slide}-dot`}
            type="button"
            aria-label={`Show slide ${index + 1}`}
            className={`signin-left-dot ${
              index === activeSlide ? "signin-left-dot-active" : ""
            }`}
            onClick={() => setActiveSlide(index)}
          />
        ))}
      </div>
    </section>
  );
}
