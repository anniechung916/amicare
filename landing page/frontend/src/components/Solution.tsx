const steps = [
  {
    num: "1",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: "Tell us about your visit",
    desc: "Upload your insurance card and provider details. Planning a visit or already went? Either works.",
  },
  {
    num: "2",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: "We predict your reimbursement",
    desc: "Our AI calls your insurance company, extracts your benefits, and generates a Smart Estimate\u2122 within 24 hours.",
    callout: "Expected reimbursement: $840\u2013$1,020 | Your cost: $380\u2013$560 | Confidence: 89%",
  },
  {
    num: "3",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "We fight for your money",
    desc: "We submit claims, call insurers daily, handle denials, file appeals, and don\u2019t stop until you\u2019re reimbursed.",
  },
  {
    num: "4",
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "You get paid",
    desc: "When your reimbursement arrives, we take 20%. No reimbursement? No fee. We only win when you win.",
  },
];

export default function Solution() {
  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-primary mb-16">
          How AmiCare works
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div key={step.num} className="relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary text-white text-lg font-bold">
                  {step.num}
                </span>
                <div className="text-secondary">{step.icon}</div>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{step.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{step.desc}</p>
              {step.callout && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-xs font-mono text-green-800">
                  {step.callout}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
