const plans = [
  {
    name: "Explorer",
    price: "$0",
    features: [
      "Basic prompt templates",
      "Community challenges",
      "Limited practice exercises",
      "Access to learning resources",
    ],
    cta: "Start Learning",
    popular: false,
  },
  {
    name: "Professional",
    price: "$19",
    features: [
      "Advanced prompt techniques",
      "Personalized feedback",
      "Unlimited exercises",
      "Real-world scenarios",
      "Progress tracking",
    ],
    cta: "Level Up Now",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    features: [
      "Custom learning paths",
      "Team analytics",
      "Private workshops",
      "Custom use cases",
      "API access",
      "Dedicated mentor",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const PricingSection = () => {
  return (
    <section className="py-16">
      <div className="mb-12 text-center">
        <h2 className="font-display text-5xl md:text-6xl font-bold mb-4 text-[#fff5eb]">
          Simple, Transparent Pricing
        </h2>
        <p className="text-xl text-white/60">
          Choose the plan that&apos;s right for you
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`rounded-2xl bg-white/5 border p-8 flex flex-col justify-between ${
              plan.popular ? "border-[#ff8a3d] ring-1 ring-[#ff8a3d]" : "border-white/10"
            }`}
          >
            <div>
              {plan.popular ? (
                <span className="bg-[#ff8a3d] text-black rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                  Most Popular
                </span>
              ) : (
                <div className="h-6" /> // spacer to align heights
              )}
              <h3 className="mt-4 text-2xl font-bold text-white">{plan.name}</h3>
              <p className="mb-6 mt-4 text-4xl font-bold text-white">{plan.price}</p>
              <ul className="mb-8 space-y-4 text-white/80">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center text-sm">
                    <svg
                      className="mr-2 h-4 w-4 text-[#ff8a3d]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <button
              className={`w-full rounded-full py-3 text-sm font-semibold transition duration-300 ${
                plan.popular
                  ? "bg-[#ff8a3d] text-black hover:bg-[#ff9b5b]"
                  : "bg-white/10 text-white hover:bg-white/15 border border-white/5"
              }`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PricingSection;
