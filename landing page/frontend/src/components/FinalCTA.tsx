export default function FinalCTA() {
  return (
    <section id="get-started" className="py-20 sm:py-28 bg-gradient-to-br from-primary to-primary-700 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-64 h-64 bg-secondary rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
          Stop letting insurance control your healthcare
        </h2>
        <p className="text-xl text-white/80 mb-10">
          Join patients who choose their providers—not their insurance network.
        </p>

        <a
          href="#"
          className="inline-flex items-center justify-center px-10 py-5 rounded-lg bg-accent text-white text-xl font-bold hover:bg-accent-600 transition-all shadow-xl shadow-accent/30 hover:shadow-2xl hover:-translate-y-0.5"
        >
          Get Started Free
        </a>

        <p className="mt-6 text-sm text-white/60">
          No credit card required &bull; HIPAA compliant &bull; Only pay when you get paid
        </p>
      </div>
    </section>
  );
}
