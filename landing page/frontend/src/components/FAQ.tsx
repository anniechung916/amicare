"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Do I need a specific type of insurance?",
    a: "AmiCare works best with PPO plans that have out-of-network benefits. HMO and EPO plans typically don\u2019t cover out-of-network care except in emergencies. Not sure what you have? We\u2019ll check for you.",
  },
  {
    q: "Can you help if I've already seen the provider?",
    a: "Yes! Upload your superbill and insurance info. We\u2019ll submit the claim and handle everything from there.",
  },
  {
    q: "How long does reimbursement take?",
    a: "Insurance companies typically process claims in 4\u20138 weeks, but some take longer. We follow up persistently until you\u2019re paid.",
  },
  {
    q: "What if my claim gets denied?",
    a: "We file appeals on your behalf. Most denials can be overturned with proper documentation and persistence\u2014which is our specialty.",
  },
  {
    q: "Is my information secure?",
    a: "Absolutely. We\u2019re HIPAA compliant and use bank-level encryption. Your data is protected.",
  },
  {
    q: "Do you work with Medicare or Medicaid?",
    a: "Currently, we focus on commercial insurance (employer plans, private PPOs). Medicare and Medicaid coverage coming soon.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 sm:py-28 bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-primary mb-16">
          Common questions
        </h2>

        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left"
              >
                <span className="font-semibold text-slate-800 pr-4">{f.q}</span>
                <svg
                  className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${
                    open === i ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {open === i && (
                <div className="px-6 pb-5">
                  <p className="text-slate-600 leading-relaxed">{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
