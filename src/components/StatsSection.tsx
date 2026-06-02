const stats = [
  {
    number: "50K+",
    label: "Learners",
    description: "Mastering prompt engineering",
  },
  {
    number: "1M+",
    label: "Prompts Created",
    description: "Through hands-on practice",
  },
  {
    number: "95%",
    label: "Success Rate",
    description: "In skill improvement",
  },
  {
    number: "200+",
    label: "Exercises",
    description: "Real-world scenarios",
  },
];

const StatsSection = () => {
  return (
    <section className="py-16">
      <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <div className="text-[#ff8a3d] mb-2 text-4xl font-bold font-mono">
              {stat.number}
            </div>
            <div className="mb-1 text-xl font-semibold text-white">{stat.label}</div>
            <p className="text-sm text-white/60">{stat.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StatsSection;
