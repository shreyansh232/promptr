const testimonials = [
  {
    name: "Sarah Chen",
    role: "AI Product Manager",
    content: "Promptr's hands-on approach helped me master prompt engineering in weeks. The interactive exercises and real-world scenarios are brilliant.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop"
  },
  {
    name: "James Wilson",
    role: "ML Engineer",
    content: "The structured learning path and immediate feedback on prompt crafting have dramatically improved my ability to work with AI models.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100&auto=format&fit=crop"
  },
  {
    name: "Maria Garcia",
    role: "NLP Researcher",
    content: "From basic completions to complex chain-of-thought prompting, Promptr's practical exercises made learning engaging and effective.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop"
  }
];
  
  
  const TestimonialsSection = () => {
  return (
    <section className="py-16">
      <div className="text-center mb-12">
        <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 text-[#fff5eb]">Loved by Users</h2>
        <p className="text-xl text-white/60">See what our users have to say about their experience</p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {testimonials.map((testimonial, index) => (
          <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
            <p className="text-white/80 leading-relaxed mb-6">&ldquo;{testimonial.content}&rdquo;</p>
            <div className="flex items-center">
              <img
                src={testimonial.image}
                alt={testimonial.name}
                className="w-12 h-12 rounded-full mr-4 object-cover border border-white/10"
              />
              <div>
                <h4 className="font-semibold text-white">{testimonial.name}</h4>
                <p className="text-sm text-white/60">{testimonial.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
  
  export default TestimonialsSection;
  