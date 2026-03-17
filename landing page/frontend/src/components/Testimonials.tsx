const testimonials = [
  {
    quote:
      "I wanted to see a specialist who didn't take my insurance. AmiCare told me I'd pay around $400 out of pocket—and they were right. They handled everything. I got my $850 reimbursement in 6 weeks.",
    name: "Sarah M.",
    location: "Denver",
  },
  {
    quote:
      "I've been avoiding an out-of-network therapist I loved because I thought it would be too expensive. AmiCare showed me I'd actually only pay $60 more per session than in-network. Totally worth it.",
    name: "James T.",
    location: "Brooklyn",
  },
  {
    quote:
      "My insurance denied my claim twice. I was ready to give up. AmiCare filed an appeal, called them every week, and got me $1,200 back. I paid them $240—best money I've spent.",
    name: "Rebecca L.",
    location: "Austin",
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-primary mb-16">
          Real patients, real results
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-slate-50 rounded-2xl p-8 relative">
              <svg className="w-8 h-8 text-secondary/30 mb-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11H10v10H0z" />
              </svg>
              <p className="text-slate-700 leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">{t.name[0]}</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{t.name}</p>
                  <p className="text-slate-500 text-xs">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
