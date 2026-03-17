const problems = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "You don't know what you'll pay",
    body: "Insurance companies make reimbursement impossible to predict. You're left guessing whether you'll owe $200 or $2,000.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    title: "Hours on hold with insurance",
    body: "Navigating phone trees, waiting on hold, getting transferred, repeating your member ID 12 times—just to get a vague answer.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    title: "Claims get denied for no reason",
    body: "Even when you do everything right, insurers delay, deny, or underpay. Fighting appeals is exhausting—so most people give up.",
  },
];

export default function Problem() {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-primary mb-16">
          Why patients avoid out-of-network care
        </h2>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {problems.map((p, i) => (
            <div key={i} className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 text-red-500 mb-6">
                {p.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">{p.title}</h3>
              <p className="text-slate-600 leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-primary-50 border border-primary-100 rounded-2xl p-8 text-center">
          <p className="text-lg text-primary font-semibold">
            Result: Billions in out-of-network benefits go unclaimed every year. Patients default
            to in-network providers—even when they&apos;d prefer someone else.
          </p>
        </div>
      </div>
    </section>
  );
}
