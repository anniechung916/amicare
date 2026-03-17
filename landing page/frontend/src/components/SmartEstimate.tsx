export default function SmartEstimate() {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-primary mb-4">
          Know what you&apos;ll pay—before you go
        </h2>
        <p className="text-center text-slate-600 text-lg mb-12 max-w-2xl mx-auto">
          No more guessing. Make informed decisions about your healthcare.
        </p>

        <div className="max-w-md mx-auto">
          <div className="bg-white border-2 border-primary/10 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-primary px-6 py-4">
              <p className="text-xs font-bold text-secondary-200 tracking-widest uppercase">
                Smart Estimate&trade;
              </p>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Provider</p>
                <p className="text-slate-800 font-semibold">Dr. Sarah Chen, Psychiatry</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Charge Amount</p>
                <p className="text-slate-800 font-semibold text-2xl">$1,400</p>
              </div>

              <hr className="border-slate-100" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Expected Reimbursement</p>
                  <p className="text-green-600 font-bold text-lg">$840 – $1,020</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Your Out-of-Pocket</p>
                  <p className="text-slate-800 font-bold text-lg">$380 – $560</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Confidence Level</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-secondary font-bold">89%</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-2.5 h-2.5 rounded-full bg-secondary" />
                      ))}
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Timeline</p>
                  <p className="text-slate-700 font-semibold text-sm mt-1">4–8 weeks</p>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Deductible Status</p>
                  <p className="text-slate-700 font-medium">$500 met of $1,000</p>
                  <div className="mt-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full w-1/2 bg-secondary rounded-full" />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Coinsurance</p>
                  <p className="text-slate-700 font-medium">70% (out-of-network)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-10">
          <a
            href="#get-started"
            className="inline-flex items-center justify-center px-8 py-4 rounded-lg bg-accent text-white text-lg font-bold hover:bg-accent-600 transition-all shadow-lg shadow-accent/30"
          >
            Get Your Estimate
          </a>
        </div>
      </div>
    </section>
  );
}
