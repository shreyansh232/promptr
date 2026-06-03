export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="container mx-auto px-4 py-20">
      <h2 className="mb-12 text-center font-display text-5xl text-[#fff5eb] md:text-6xl">
        How It Works
      </h2>
      <div className="grid gap-8 md:grid-cols-3">
        <StepCard
          number={1}
          title="Write Your Prompt"
          description="Enter your prompt in our interactive editor."
        />
        <StepCard
          number={2}
          title="Get Instant Analysis"
          description="Our AI evaluates your prompt's effectiveness."
        />
        <StepCard
          number={3}
          title="Improve and Learn"
          description="Apply suggestions and watch your skills grow."
        />
      </div>
    </section>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#ff8a3d] text-2xl font-bold text-[#111111]">
        {number}
      </div>
      <h3 className="mb-2 text-xl font-semibold text-white">{title}</h3>
      <p className="text-white/60">{description}</p>
    </div>
  );
}
