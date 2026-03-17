export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 bg-gradient-to-br from-primary-50 via-white to-secondary-50 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-10">
        <div className="absolute top-20 right-20 w-72 h-72 bg-secondary rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-40 w-96 h-96 bg-primary rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-3xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-primary leading-tight tracking-tight">
            Never fight insurance again.
          </h1>
          <p className="mt-4 text-xl sm:text-2xl font-semibold text-slate-700">
            See any doctor you want. We&apos;ll get you reimbursed.
          </p>
          <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-2xl">
            Out-of-network providers often mean better care, faster appointments, and the specialists you trust.
            Stop letting insurance networks limit your healthcare decisions. AmiCare handles the paperwork,
            the phone calls, the denials, and the appeals—so you don&apos;t have to.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <a
              href="#get-started"
              className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-accent text-white text-lg font-bold hover:bg-accent-600 transition-all shadow-lg shadow-accent/30 hover:shadow-xl hover:shadow-accent/40 hover:-translate-y-0.5"
            >
              Get Started Free
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-white text-primary text-lg font-semibold border-2 border-primary/20 hover:border-primary/40 transition-all hover:-translate-y-0.5"
            >
              See How It Works
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>HIPAA Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>No upfront fees</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>20% fee only when you get paid</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
