const rows = [
  ["Hours on hold", "AI agents that never hang up"],
  ["One call, then you give up", "Persistent daily follow-ups"],
  ["Confusing insurance jargon", "We speak insurance fluently"],
  ["Denials feel personal", "Denials are just data to us"],
  ["You pay upfront for help", "You pay nothing unless we win"],
  ["Uncertainty & stress", "Predictable outcomes & peace of mind"],
];

export default function Benefits() {
  return (
    <section className="py-20 sm:py-28 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-primary mb-16">
          Why AmiCare beats doing it yourself
        </h2>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-2">
            <div className="px-6 py-4 bg-red-50 border-b border-red-100">
              <p className="font-bold text-red-700 text-sm">You fighting insurance</p>
            </div>
            <div className="px-6 py-4 bg-green-50 border-b border-green-100">
              <p className="font-bold text-green-700 text-sm">AmiCare fighting insurance</p>
            </div>
          </div>
          {rows.map(([bad, good], i) => (
            <div key={i} className="grid grid-cols-2 border-b border-slate-100 last:border-0">
              <div className="px-6 py-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-slate-600 text-sm">{bad}</span>
              </div>
              <div className="px-6 py-4 flex items-center gap-2 bg-green-50/30">
                <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-slate-800 text-sm font-medium">{good}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
