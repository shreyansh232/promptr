const CTASection = () => {
  return (
    <section className="relative my-12">
      <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 md:p-16 text-center">
        <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 text-[#fff5eb]">
          Master the Art of Prompt Engineering
        </h2>
        <p className="text-lg md:text-xl text-white/60 mb-8 max-w-2xl mx-auto">
          Join our community of learners and start crafting powerful, effective prompts through hands-on practice.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-[#ff8a3d] text-black hover:bg-[#ff9b5b] px-8 py-3 rounded-full font-semibold transition duration-200">
            Start Learning Free
          </button>
        </div>
      </div>
    </section>
  );
}
  
  
  export default CTASection;
  