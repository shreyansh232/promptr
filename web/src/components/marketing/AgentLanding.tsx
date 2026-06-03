import Link from "next/link";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { PUBLIC_AGENT_MISSION } from "@/data/agent-dojo";
import { PromptrLogo } from "@/components/shared/PromptrLogo";
const proofStats = [
  { value: "3-part loop", label: "Draft, test, patch" },
  { value: "Tool-aware", label: "Practice real agent constraints" },
  { value: "Interactive", label: "Get instant feedback and rewrites" },
];

const workflowSteps = [
  {
    title: "Write the instruction",
    text: "Start with a task, context, tool policy, boundaries, and the response format the agent must produce.",
  },
  {
    title: "Run scenario tests",
    text: "Promptr checks normal, edge-case, and adversarial inputs so weak instructions fail before production.",
  },
  {
    title: "Patch the highest risk",
    text: "Get a focused rewrite that fixes the clearest failure first instead of burying you in generic advice.",
  },
  {
    title: "Repeat with purpose",
    text: "Each pass reinforces a durable prompting structure that works across domains and model families.",
  },
];

const featureCards = [
  {
    title: "25 curated missions",
    text: "Five progressive levels — from basic persona control to self-evaluating meta-agents — each with calibrated test cases and adversarial scenarios.",
  },
  {
    title: "Scenario evaluation",
    text: "Every mission stress-tests your prompt against tool-use correctness, workflow sequencing, guardrail enforcement, and prompt injection resistance.",
  },
  {
    title: "Rewrite coaching",
    text: "See a stronger version of your prompt, then learn exactly why the patch improves reliability.",
  },
  {
    title: "Progressive curriculum",
    text: "Start with greeting bots and output formatting. Finish writing meta-agents that evaluate other agents' prompts.",
  },
  {
    title: "Custom Prompt Tests",
    text: "Create custom prompt tests for any agent with custom descriptions and tools. Stress-test instructions against dynamically generated adversarial scenarios.",
  },
  {
    title: "Developer-first stack",
    text: "Next.js + FastAPI + LLM Engine. The learning surface stays close to the systems developers actually ship.",
  },
];

const practicePaths = [
  {
    title: "Public mission",
    text: "Try the customer support bot mission without building a full profile.",
    href: "/missions",
    action: "Open missions",
  },
  {
    title: "Custom Prompt Testing Lab",
    text: "Create custom prompt tests for your own agents. Describe your agent and its tools to generate evaluation scenarios instantly.",
    href: "/lab",
    action: "Go to lab",
  },
  {
    title: "Skill profile",
    text: "Set your level, expertise, goals, and learning style so feedback meets you where you are.",
    href: "/profile",
    action: "Tune profile",
  },
];

const faqs = [
  {
    question: "Why can't I just test my prompts in ChatGPT or Claude?",
    answer:
      "You can — but you won't get structured evaluation against adversarial scenarios, tool-use correctness, guardrail enforcement, and workflow control. Promptr runs your prompt through curated test cases that expose the exact failure modes production agents hit. ChatGPT tells you if a prompt sounds good; Promptr tells you if it survives edge cases.",
  },
  {
    question:
      "How is Promptr different from agent reliability tools like Galileo or Patronus?",
    answer:
      "Those tools monitor agents in production — they catch failures after deployment. Promptr works upstream: it trains the developer to write better instructions before the agent ships. Think of it as the gym before the game. Better prompts mean fewer production failures to monitor in the first place.",
  },
  {
    question: "Won't prompts that work here fail in production anyway?",
    answer:
      "The goal isn't to produce copy-paste prompts. Promptr teaches durable prompting patterns — tool policies, escalation boundaries, structured output contracts, guardrail definitions — that transfer across models and environments. You learn the skill, not a specific string.",
  },
  {
    question: "What can't a company just build this internally?",
    answer:
      "They can build the eval harness. What's hard to replicate is the curated curriculum: 25 missions across 5 progressive levels, each with calibrated test cases, adversarial scenarios, and targeted failure types. That's months of instructional design. Promptr is also MIT-licensed, making it easy to integrate into your local workflows.",
  },
  {
    question: "Is this only for agent prompts?",
    answer:
      "The platform focuses on agent instruction prompts because tool use, multi-step workflows, and safety boundaries expose prompt weaknesses fastest. But the scoring, revision loop, and structured output practice apply to any prompt engineering work.",
  },
  {
    question: "Do I need an account to start?",
    answer:
      "No. The public playground mission is available immediately with no sign-up. Create an account when you want saved progress and access to the full 25-mission curriculum.",
  },
];

interface AgentLandingProps {
  isAuthenticated?: boolean;
}

export function AgentLanding({ isAuthenticated = false }: AgentLandingProps) {
  return (
    <main className="overflow-hidden">
      <HeroSection isAuthenticated={isAuthenticated} />
      <ProofStrip />
      <WorkflowSection />
      <FeaturesSection />
      <MissionSection />
      <PracticePathsSection />
      <FAQSection />
      <CTASection />
    </main>
  );
}

function HeroSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <section className="relative border-b border-[var(--landing-line)] px-4 pt-24 sm:px-6 lg:px-8">
      <div className="relative z-10 mx-auto grid min-h-[76svh] w-full max-w-7xl items-center pb-8 pt-8 md:min-h-[82svh] md:grid-cols-2 md:gap-12 lg:gap-16">
        <div className="max-w-2xl py-12 md:py-16">
          <div className="border-[var(--landing-signal)]/35 bg-[var(--landing-signal)]/10 mb-5 inline-flex items-center gap-2 border px-3 py-1.5 font-mono text-xs uppercase text-[var(--landing-signal)]">
            <span className="h-1.5 w-1.5 bg-[var(--landing-signal)]" />
            prompt engineering & evaluation platform
          </div>
          <h1 className="max-w-none text-4xl font-semibold leading-[1.08] text-[var(--landing-paper)] sm:text-5xl md:text-6xl lg:text-7xl">
            Stress-test prompts for{" "}
            <span className="text-[#48d8a4]"> AI agents</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[var(--landing-muted)] sm:text-lg">
            Test your prompts before seeing them fail in production, and learn
            the fundamentals of creating prompts that are stress-tested and work
            perfectly in production through our curated missions.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {isAuthenticated ? (
              <>
                <Link
                  href="/lab"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-none bg-[#48d8a4] px-5 font-mono text-xs uppercase text-[var(--landing-ink)] transition-colors hover:bg-[var(--landing-signal-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--landing-signal)]"
                >
                  Go to Lab
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link
                  href="/missions"
                  className="bg-[var(--landing-panel)]/80 hover:border-[var(--landing-signal)]/45 inline-flex h-12 items-center justify-center rounded-none border border-[var(--landing-line)] px-5 font-mono text-xs uppercase text-[var(--landing-paper)] transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--landing-signal)]"
                >
                  Go to Missions
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/lab"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-none bg-[var(--landing-signal)] px-5 font-mono text-xs uppercase text-[var(--landing-ink)] transition-colors hover:bg-[var(--landing-signal-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--landing-signal)]"
                >
                  Try Lab
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link
                  href="/missions"
                  className="bg-[var(--landing-panel)]/80 hover:border-[var(--landing-signal)]/45 inline-flex h-12 items-center justify-center rounded-none border border-[var(--landing-line)] px-5 font-mono text-xs uppercase text-[var(--landing-paper)] transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--landing-signal)]"
                >
                  Try Missions
                </Link>
              </>
            )}
          </div>
        </div>

        <HeroWorkbench />
      </div>
    </section>
  );
}

function HeroWorkbench() {
  const visibleTests = PUBLIC_AGENT_MISSION.testCases.slice(0, 3);

  return (
    <div
      aria-hidden="true"
      className="landing-grid-bg pointer-events-none absolute inset-x-3 top-28 z-0 hidden h-[460px] opacity-35 sm:inset-x-8 md:relative md:bottom-auto md:left-auto md:right-auto md:top-auto md:ml-auto md:block md:h-[510px] md:w-full md:max-w-[660px] md:translate-y-0 md:opacity-100"
    >
      <div className="bg-[var(--landing-panel)]/90 h-full border border-[var(--landing-line)] shadow-[0_36px_120px_rgba(0,0,0,0.44)]">
        <div className="flex h-12 items-center justify-between border-b border-[var(--landing-line)] px-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--landing-heat)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--landing-caution)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
          </div>
          <span className="font-mono text-[11px] uppercase text-[var(--landing-muted)]">
            eval console
          </span>
        </div>

        <div className="grid h-[calc(100%-3rem)] md:grid-cols-[1.15fr_0.85fr]">
          <div className="border-b border-[var(--landing-line)] p-4 md:border-b-0 md:border-r">
            <div className="mb-3 flex items-center justify-between font-mono text-[11px] uppercase text-[var(--landing-muted)]">
              <span>instruction</span>
              <span className="text-[var(--landing-signal)]">patched</span>
            </div>
            <pre className="h-[240px] overflow-hidden whitespace-pre-wrap border border-[var(--landing-line)] bg-[var(--landing-code)] p-4 font-mono text-xs leading-6 text-[var(--landing-paper)] md:h-[calc(100%-2rem)]">
              {`You are a customer support bot.

1. Greet the customer politely.
2. Request an order_id if it is missing.
3. Reject refunds for order IDs not starting with 'ORD-'.
4. Never make up or guess order statuses.

Return: greeting, status lookup, refund status.`}
            </pre>
          </div>

          <div className="grid grid-rows-[auto_1fr_auto]">
            <div className="border-b border-[var(--landing-line)] p-4">
              <div className="font-mono text-[11px] uppercase text-[var(--landing-muted)]">
                score
              </div>
              <div className="mt-3 flex items-end gap-3">
                <span className="text-5xl font-semibold text-[var(--landing-signal)]">
                  91
                </span>
                <span className="pb-2 font-mono text-xs uppercase text-[var(--landing-paper)]">
                  strong
                </span>
                <span className="landing-cursor mb-3 h-5 w-2 bg-[var(--landing-signal)]" />
              </div>
            </div>

            <div className="space-y-3.5 p-4">
              {visibleTests.map((testCase) => (
                <div
                  key={testCase.id}
                  className="border border-[var(--landing-line)] bg-black/20 p-3"
                >
                  <div className="flex items-center gap-2 font-mono text-xs text-[var(--landing-paper)]">
                    <CheckCircle
                      size={14}
                      className="shrink-0 text-[var(--landing-signal)]"
                      aria-hidden="true"
                    />
                    {testCase.id}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[var(--landing-muted)]">
                    {testCase.failureType}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-[var(--landing-line)] p-4 pt-3.5 font-mono text-[10px] uppercase text-[var(--landing-muted)]">
              <span>total checks: 3</span>
              <span className="text-[var(--landing-signal)]">all passing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProofStrip() {
  return (
    <section
      aria-label="Promptr learning loop"
      className="border-b border-[var(--landing-line)] bg-[var(--landing-ink-soft)] px-4 sm:px-6 lg:px-8"
    >
      <dl className="mx-auto grid max-w-7xl gap-px border-x border-[var(--landing-line)] bg-[var(--landing-line)] sm:grid-cols-3">
        {proofStats.map((stat) => (
          <div key={stat.value} className="bg-[var(--landing-ink-soft)] p-5">
            <dt className="font-mono text-xs uppercase text-[var(--landing-dim)]">
              {stat.label}
            </dt>
            <dd className="mt-2 text-2xl font-semibold text-[var(--landing-paper)]">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section
      id="workflow"
      className="border-b border-[var(--landing-line)] px-4 py-16 sm:px-6 md:py-20 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="Workflow"
          title="A deliberate loop for getting better at prompting."
          text="Promptr turns prompt engineering into reps: draft the instruction, test the behavior, patch the failure, and practice the next version."
        />

        <div className="mt-10 grid gap-3 md:grid-cols-4">
          {workflowSteps.map((step, index) => (
            <article
              key={step.title}
              className="border border-[var(--landing-line)] bg-[var(--landing-panel)] p-5"
            >
              <div className="font-mono text-xs uppercase text-[var(--landing-signal)]">
                0{index + 1}
              </div>
              <h3 className="mt-8 text-xl font-semibold text-[var(--landing-paper)]">
                {step.title}
              </h3>
              <p className="mt-4 text-sm leading-6 text-[var(--landing-muted)]">
                {step.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section
      id="features"
      className="border-b border-[var(--landing-line)] bg-[var(--landing-ink-soft)] px-4 py-16 sm:px-6 md:py-20 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="Features"
          title="Everything you need to ship reliable AI agents."
          text="Curated missions, scenario-based evaluation, rewrite coaching, and a progressive curriculum designed for developers who build with LLMs."
        />

        <div className="mt-10 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {featureCards.map((feature, index) => (
            <article
              key={feature.title}
              className={
                index === 0
                  ? "border-[var(--landing-signal)]/45 border bg-[var(--landing-signal)] p-5 text-[var(--landing-ink)]"
                  : "border border-[var(--landing-line)] bg-[var(--landing-panel)] p-5"
              }
            >
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p
                className={
                  index === 0
                    ? "mt-4 text-sm leading-6 text-[var(--landing-on-signal)]"
                    : "mt-4 text-sm leading-6 text-[var(--landing-muted)]"
                }
              >
                {feature.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function MissionSection() {
  return (
    <section
      id="mission"
      className="border-b border-[var(--landing-line)] px-4 py-16 sm:px-6 md:py-20 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="Public mission"
          title={PUBLIC_AGENT_MISSION.title}
          text={PUBLIC_AGENT_MISSION.brief}
        />

        <div className="mt-10 grid border border-[var(--landing-line)] bg-[var(--landing-panel)] lg:grid-cols-[1fr_1.1fr]">
          <div className="border-b border-[var(--landing-line)] p-5 lg:border-b-0 lg:border-r">
            <div className="flex flex-wrap gap-2">
              {PUBLIC_AGENT_MISSION.tags.map((tag) => (
                <span
                  key={tag}
                  className="border border-[var(--landing-line)] px-2.5 py-1 font-mono text-[11px] uppercase text-[var(--landing-muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>

            <h3 className="mt-8 text-2xl font-semibold text-[var(--landing-paper)]">
              Starter instruction
            </h3>
            <pre className="mt-4 whitespace-pre-wrap break-words border border-[var(--landing-line)] bg-[var(--landing-code)] p-4 font-mono text-xs leading-6 text-[var(--landing-paper)]">
              {PUBLIC_AGENT_MISSION.starterInstructions}
            </pre>

            <h3 className="mt-8 text-2xl font-semibold text-[var(--landing-paper)]">
              Tool policy to learn
            </h3>
            <div className="mt-4 grid gap-3">
              {PUBLIC_AGENT_MISSION.availableTools.map((tool) => (
                <div
                  key={tool.name}
                  className="border border-[var(--landing-line)] bg-black/15 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-[var(--landing-paper)]">
                      {tool.name}
                    </span>
                    <span className="border border-[var(--landing-line)] px-2 py-0.5 font-mono text-[10px] uppercase text-[var(--landing-muted)]">
                      {tool.riskLevel} risk
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--landing-muted)]">
                    {tool.expectedUsage}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5">
            <h3 className="text-2xl font-semibold text-[var(--landing-paper)]">
              Eval targets
            </h3>
            <div className="mt-4 grid gap-3">
              {PUBLIC_AGENT_MISSION.testCases.map((testCase) => (
                <article
                  key={testCase.id}
                  className="border border-[var(--landing-line)] bg-black/15 p-4"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle
                      size={18}
                      className="mt-0.5 shrink-0 text-[var(--landing-signal)]"
                      aria-hidden="true"
                    />
                    <div>
                      <h4 className="font-mono text-sm text-[var(--landing-paper)]">
                        {testCase.id}
                      </h4>
                      <p className="mt-2 text-sm leading-6 text-[var(--landing-muted)]">
                        {testCase.expectedBehavior}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PracticePathsSection() {
  return (
    <section className="border-b border-[var(--landing-line)] bg-[var(--landing-ink-soft)] px-4 py-16 sm:px-6 md:py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionIntro
          eyebrow="Pages"
          title="The key Promptr pages are one decision away."
          text="Move from the landing page into the real learning surfaces: public missions, personalized dashboard practice, and your profile."
        />

        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {practicePaths.map((path) => (
            <article
              key={path.title}
              className="flex min-h-[260px] flex-col justify-between border border-[var(--landing-line)] bg-[var(--landing-panel)] p-5"
            >
              <div>
                <h3 className="text-2xl font-semibold text-[var(--landing-paper)]">
                  {path.title}
                </h3>
                <p className="mt-4 text-sm leading-6 text-[var(--landing-muted)]">
                  {path.text}
                </p>
              </div>
              <Link
                href={path.href}
                className="hover:border-[var(--landing-signal)]/45 mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-none border border-[var(--landing-line)] px-4 font-mono text-xs uppercase text-[var(--landing-paper)] transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--landing-signal)]"
              >
                {path.action}
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section
      id="faq"
      className="border-b border-[var(--landing-line)] px-4 py-16 sm:px-6 md:py-20 lg:px-8"
    >
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionIntro
          eyebrow="FAQ"
          title="Answers to the questions we actually get asked."
          text="We built Promptr after asking ourselves these same questions. Here is what we landed on."
        />

        <div className="space-y-3">
          {faqs.map((item) => (
            <details
              key={item.question}
              className="open:border-[var(--landing-signal)]/45 group border border-[var(--landing-line)] bg-[var(--landing-panel)] p-5"
            >
              <summary className="cursor-pointer list-none text-lg font-semibold text-[var(--landing-paper)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--landing-signal)]">
                {item.question}
              </summary>
              <p className="mt-4 text-sm leading-6 text-[var(--landing-muted)]">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="px-4 py-16 sm:px-6 md:py-20 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 border border-[var(--landing-line)] bg-[var(--landing-panel-strong)] p-6 md:grid-cols-[1fr_auto] md:items-center md:p-8">
        <div>
          <PromptrLogo showWordmark={false} />
          <h2 className="mt-6 max-w-3xl text-3xl font-semibold leading-tight text-[var(--landing-paper)] sm:text-4xl">
            Start with one mission. Leave with prompts that survive production.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--landing-muted)]">
            25 curated missions. 5 progressive levels. The fastest way to learn
            prompt engineering is to watch a prompt fail, patch it, and remember
            the pattern that made it stronger.
          </p>
        </div>
        <Link
          href="/missions"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-none bg-[var(--landing-signal)] px-5 font-mono text-xs uppercase text-[var(--landing-ink)] transition-colors hover:bg-[var(--landing-signal-strong)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--landing-signal)]"
        >
          Start missions
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

function SectionIntro({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="max-w-3xl">
      <div className="font-mono text-xs uppercase text-[var(--landing-signal)]">
        {eyebrow}
      </div>
      <h2 className="mt-4 text-3xl font-semibold leading-tight text-[var(--landing-paper)] sm:text-4xl md:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-base leading-7 text-[var(--landing-muted)]">
        {text}
      </p>
    </div>
  );
}
