const faqs = [
  {
    question: "Who is Promptr for?",
    answer:
      "It is for learners and working teams who want a structured way to improve prompting instead of relying on trial and error.",
  },
  {
    question: "How does the level system work?",
    answer:
      "Each level changes the kind of problem statement you receive and the depth of feedback you get back from the coach.",
  },
  {
    question: "Do I get examples or only scores?",
    answer:
      "You get both. Promptr scores the draft, explains the reasoning, and offers improved prompt suggestions you can use as the next pass.",
  },
  {
    question: "Is this only for creative prompting?",
    answer:
      "No. The coaching model works across writing, support, research, coding, operations, and other prompt-driven workflows.",
  },
  {
    question: "What makes the dashboard different now?",
    answer:
      "The workflow is deliberately minimal: read the problem, write a prompt, analyze it, then revise with the suggested changes.",
  },
];

export default function FAQSection() {
  return (
    <section className="bg-[#111111] px-4 py-20 md:px-8" id="faq">
      <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="text-[11px] uppercase tracking-[0.32em] text-[#f0a067]">
            FAQ
          </div>
          <h2 className="mt-5 text-4xl leading-tight text-[#fff5eb] md:text-6xl">
            Clear answers, same tone as the product.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#b8b0a5]">
            The positioning is intentionally narrow. Promptr helps users get
            better at prompt quality through revision, not through content
            generation gimmicks.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((item) => (
            <details
              key={item.question}
              className="group rounded-[1.6rem] border border-white/10 bg-[#171717] px-6 py-5 open:border-[#ff8a3d]/40 open:bg-[#1f1711]"
            >
              <summary className="cursor-pointer list-none pr-8 text-xl text-[#fff5eb] marker:hidden">
                {item.question}
              </summary>
              <p className="mt-4 text-base leading-7 text-[#c9c0b5]">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
