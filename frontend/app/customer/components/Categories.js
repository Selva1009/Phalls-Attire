"use client";
import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const categories = [
  { name: "Women’s Tops" },
  { name: "Exquisite Churidar Suits" },
  { name: "Premium Co-Ord Sets" },
  { name: "Designer Gowns" },
  { name: "Kurta, Pant & Dupatta Ensembles" },
  { name: "Nightwear Trio Sets" },
  { name: "Pure Cotton Nightwear" },
  { name: "Signature Leggings" },
  { name: "Ethnic Tops with Palazzo" },
  { name: "Trendy Tops & T-Shirts" },
  { name: "Designer Sarees" },
];

const CategoryMenu = ({ setCategoryFilter }) => {
  const [activeCategory, setActiveCategory] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMouseEnterCategory = (categoryName) => {
    if (isMobile) return;

    setActiveCategory(categoryName);
  };

  const handleMouseLeaveCategory = () => {
    if (isMobile) return;
  };

  const handleScroll = (direction) => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = direction === "left" ? -200 : 200;
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleMobileCategoryClick = (categoryName) => {
    if (!isMobile) return;

    if (activeCategory === categoryName) {
      setActiveCategory(null);
    } else {
      setActiveCategory(categoryName);
      setCategoryFilter(categoryName);
    }
  };

  return (
    <div className="relative w-full border-y border-[#f3cade] bg-white/70 backdrop-blur-xl">
      <div className="relative hidden sm:block">
        <div className="hide-scrollbar overflow-x-auto whitespace-nowrap px-6 py-5">
          <div className="relative z-20 flex space-x-4 text-gray-800">
            {categories.map((category, index) => (
              <div
                key={index}
                className="relative inline-block"
                onMouseEnter={() => handleMouseEnterCategory(category.name)}
                onMouseLeave={handleMouseLeaveCategory}
              >
                <button
                  className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                    activeCategory === category.name
                      ? "border-[#E91E63] bg-[#E91E63] text-white shadow-md"
                      : "border-[#f0cedd] bg-[#fff5f9] text-[#6b515c] hover:-translate-y-0.5 hover:border-[#E91E63] hover:text-[#AD1457]"
                  }`}
                  onClick={() => setCategoryFilter(category.name)}
                >
                  {category.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sm:hidden">
        <div className="relative px-4 py-4">
          <button
            onClick={() => handleScroll("left")}
            className="absolute bottom-0 left-0 top-0 z-10 flex w-8 items-center justify-center bg-gradient-to-r from-[#fff8fb] to-transparent"
          >
            <ChevronLeft className="text-[#AD1457]" size={20} />
          </button>

          <div
            ref={scrollContainerRef}
            className="hide-scrollbar flex space-x-3 overflow-x-auto px-2"
            style={{ scrollbarWidth: "none" }}
          >
            {categories.map((category, index) => (
              <div key={index} className="flex-shrink-0">
                <button
                  onClick={() => handleMobileCategoryClick(category.name)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                    activeCategory === category.name
                      ? "border-[#E91E63] bg-[#E91E63] text-white"
                      : "border-[#f0cedd] bg-white text-[#6b515c]"
                  } shadow-sm`}
                >
                  {category.name}
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => handleScroll("right")}
            className="absolute bottom-0 right-0 top-0 z-10 flex w-8 items-center justify-center bg-gradient-to-l from-[#fff8fb] to-transparent"
          >
            <ChevronRight className="text-[#AD1457]" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryMenu;
