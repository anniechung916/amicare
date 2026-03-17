const cases = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "See the therapist you trust",
    subtitle: "Mental Health Patients",
    body: "Most great therapists don\u2019t take insurance. We make out-of-network therapy financially viable.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Get specialized dental work covered",
    subtitle: "Dental Patients",
    body: "Orthodontics, oral surgery, cosmetic dentistry\u2014unlock your out-of-network dental benefits.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    title: "Access top specialists",
    subtitle: "Specialty Consultations",
    body: "Need a second opinion or niche expert? Don\u2019t let network restrictions limit your care.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    title: "Premium care, maximized coverage",
    subtitle: "Concierge Medicine",
    body: "Concierge doctors often don\u2019t take insurance. We get you reimbursed for membership fees and visits.",
  },
];

export default function UseCases() {
  return (
    <section className="py-20 sm:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-primary mb-16">
          Who AmiCare helps
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {cases.map((c, i) => (
            <div key={i} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-secondary-50 text-secondary mb-5">
                {c.icon}
              </div>
              <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">{c.subtitle}</p>
              <h3 className="text-lg font-bold text-slate-800 mb-2">{c.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
