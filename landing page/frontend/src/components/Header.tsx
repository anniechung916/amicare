"use client";

import { useState, useEffect } from "react";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-sm shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <a href="#" className="text-2xl font-bold text-primary">
            AmiCare
          </a>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">
              Pricing
            </a>
            <a href="#faq" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">
              FAQ
            </a>
            <a
              href="#get-started"
              className="inline-flex items-center px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
            >
              Get Started Free
            </a>
          </nav>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-slate-600"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t shadow-lg">
          <div className="px-4 py-4 space-y-3">
            <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-slate-600 hover:text-primary">
              How It Works
            </a>
            <a href="#pricing" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-slate-600 hover:text-primary">
              Pricing
            </a>
            <a href="#faq" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-slate-600 hover:text-primary">
              FAQ
            </a>
            <a
              href="#get-started"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold"
            >
              Get Started Free
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
