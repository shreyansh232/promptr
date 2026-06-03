const CTASection = () => {
  return (
    <section className="relative my-12">
      <div className="rounded-none border border-white/10 bg-white/5 p-8 text-center md:p-16">
        <h2 className="mb-4 font-display text-4xl font-bold text-[#fff5eb] md:text-5xl">
          Master the Art of Prompt Engineering
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-white/60 md:text-xl">
          Join our community of learners and start crafting powerful, effective
          prompts through hands-on practice.
        </p>
        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <button className="rounded-none bg-[#ff8a3d] px-8 py-3 font-semibold text-black transition duration-200 hover:bg-[#ff9b5b]">
            Start Learning Free
          </button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
