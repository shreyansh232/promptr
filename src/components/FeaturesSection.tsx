"use client";

const features = [
  {
    title: "Level-specific practice",
    description:
      "Each user lands on a problem statement calibrated to beginner, intermediate, or expert prompt work.",
  },
  {
    title: "Sharper scoring",
    description:
      "Promptr flags what is underspecified, weakly structured, or missing from the draft so the next version has direction.",
  },
  {
    title: "Rewrite-driven coaching",
    description:
      "The product teaches through revision, not passive tips. Users see a stronger version and then improve their own.",
  },
  {
    title: "Minimal workspace",
    description:
      "The interface cuts out decorative panels so the user can focus on the prompt, feedback, and the next tweak.",
  },
  {
    title: "Context-aware feedback",
    description:
      "Level, domain, goals, and learning style shape the explanations and rewrite suggestions the user receives.",
  },
  {
    title: "Practice that compounds",
    description:
      "Every pass reinforces the same durable structure: task, context, constraints, and response format.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="bg-[#171717] px-4 py-20 md:px-8 md:py-24" id="features">
      <div className="mx-auto w-full max-w-6xl">
        <div className="max-w-3xl">
          <div className="text-[11px] uppercase tracking-[0.32em] text-[#f0a067]">
            Features
          </div>
          <h2 className="mt-5 text-4xl leading-tight text-[#fff5eb] md:text-6xl">
            Hands on approach to learn prompt engineering
          </h2>
          <p className="mt-6 text-lg leading-8 text-[#b8b0a5]">
            Promptr is built around disciplined prompt iteration, so the
            product story stays direct: write, score, revise, improve.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-12">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className={`rounded-[1.8rem] border border-white/10 px-6 py-6 ${
                index === 0
                  ? "bg-[#ff8a3d] text-[#111111] xl:col-span-5"
                  : index === 1
                    ? "bg-[#0f0f0f] text-[#f4ece3] xl:col-span-4"
                    : index === 2
                      ? "bg-[#0f0f0f] text-[#f4ece3] xl:col-span-3"
                      : "bg-[#101010] text-[#f4ece3] xl:col-span-4"
              }`}
            >
              <div
                className={`text-[11px] uppercase tracking-[0.28em] ${
                  index === 0 ? "text-[#3b2416]" : "text-[#f0a067]"
                }`}
              >
                0{index + 1}
              </div>
              <h3 className="mt-5 text-3xl leading-tight">
                {feature.title}
              </h3>
              <p
                className={`mt-4 text-base leading-7 ${
                  index === 0 ? "text-[#3b2416]" : "text-[#c9c0b5]"
                }`}
              >
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
