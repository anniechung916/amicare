const faqs = [
  {
    q: "What if you don't recover anything?",
    a: "You owe us nothing.",
  },
  {
    q: "When do I pay?",
    a: "Only after you receive your reimbursement check.",
  },
  {
    q: "Are there any other fees?",
    a: "Nope. 20% of recovered amount, that's it.",
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 sm:py-28 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-primary mb-16">
          Simple, success-based pricing
        </h2>

        <div className="bg-gradient-to-br from-primary to-primary-700 rounded-3xl p-10 sm:p-12 text-center text-white shadow-2xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-5xl sm:text-6xl font-extrabold mb-2">20%</p>
          <p className="text-xl font-semibold text-white/80 mb-8">Success Fee</p>
          <p className="text-lg text-white/70 mb-8">We only get paid when you get paid.</p>

          <div className="space-y-3 text-left max-w-xs mx-auto mb-10">
            {[
              "No upfront costs",
              "No monthly subscriptions",
              "No hidden fees",
              "If we recover $1,000, you keep $800",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <svg className="w-5 h-5 text-secondary-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-white/90">{item}</span>
              </div>
            ))}
          </div>

          <p className="text-sm font-semibold text-secondary-200 mb-6">Zero risk. Maximum reward.</p>

          <a
            href="#get-started"
            className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-accent text-white text-lg font-bold hover:bg-accent-600 transition-all shadow-lg"
          >
            Get Started Free
          </a>
        </div>

        <div className="mt-12 space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className="bg-slate-50 rounded-xl p-5">
              <p className="font-semibold text-slate-800 text-sm">{f.q}</p>
              <p className="text-slate-600 text-sm mt-1">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
