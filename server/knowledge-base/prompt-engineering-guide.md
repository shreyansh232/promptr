# Prompt Engineering Knowledge Base

> **Source:** Compiled from [DAIR.AI Prompt Engineering Guide](https://github.com/dair-ai/prompt-engineering-guide) (promptingguide.ai)
> **Purpose:** Reference for generating high-quality practice problems and coaching feedback in Promptr.
> **Usage:** The problem-generation AI MUST consult this knowledge base before creating practice problems. Every problem should teach, test, or reinforce concepts documented here.

---

## 1. What Is Prompt Engineering

Prompt engineering is the discipline of developing and optimizing prompts to efficiently use language models for a wide variety of applications. Good prompt engineering:

- Improves the capacity of LLMs on common and complex tasks (question answering, reasoning, code generation).
- Helps designers understand model capabilities and limitations.
- Is iterative — start simple, test, refine.

---

## 2. Elements of a Prompt

Every effective prompt contains some combination of these four elements:

| Element              | Description                                                        | Example                                                 |
| -------------------- | ------------------------------------------------------------------ | ------------------------------------------------------- |
| **Instruction**      | The specific task or instruction                                   | "Classify the text into neutral, negative, or positive" |
| **Context**          | External information that steers the model toward better responses | Background about the domain, audience, or constraints   |
| **Input Data**       | The actual input or question to respond to                         | "I think the food was okay."                            |
| **Output Indicator** | The type or format of the output                                   | "Sentiment:" or "Return JSON only"                      |

**Key insight for problem design:** Practice problems should teach learners to identify which elements are missing from a draft prompt and how to add them.

---

## 3. General Tips for Designing Prompts

### 3.1 Start Simple

- Prompt engineering is iterative — experiment and refine.
- Break big tasks into simpler subtasks.
- Add complexity gradually as results improve.

### 3.2 The Instruction

- Use clear commands: "Write", "Classify", "Summarize", "Translate", "Order", etc.
- Place instructions at the beginning of the prompt.
- Use clear separators like `###` between instruction and context.

### 3.3 Specificity

- Be descriptive and detailed — the more specific, the better the results.
- Provide examples to get desired output in specific formats.
- Keep prompts concise — too many unnecessary details hurt performance.
- Experiment with different keywords, contexts, and data.

### 3.4 Avoid Impreciseness

- Be specific and direct, not clever.
- Instead of "Keep the explanation short, only a few sentences, and don't be too descriptive" → "Use 2-3 sentences to explain X to a high school student."

### 3.5 To Do or Not To Do

- Say what **to do** instead of what **not to do**.
- Negative instructions ("DO NOT ask for interests") are often ignored by the model.
- Rephrase as positive constraints: "The agent should recommend a movie from top global trending movies."

---

## 4. Prompting Techniques

### 4.1 Zero-Shot Prompting

- The model is asked to perform a task **without any examples**.
- Works well for simple, common tasks that the model was trained on.
- Example: `Classify the text into neutral, negative or positive. Text: I think the vacation is okay. Sentiment:`
- **When to test:** Give learners a task where zero-shot works, then show how adding structure improves it further.

### 4.2 Few-Shot Prompting

- Provide **demonstrations (examples)** in the prompt to steer the model via in-context learning.
- Works better than zero-shot for complex or novel tasks.
- Key findings from research:
  - The **label space** and **distribution of input text** in demonstrations matter.
  - The **format** plays a key role — even random labels with correct format outperform no labels.
  - Selecting labels from a **true distribution** helps more than uniform random.
- Example:

  ```
  A "whatpu" is a small, furry animal native to Tanzania.
  An example sentence: We were traveling in Africa and we saw these very cute whatpus.

  To do a "farduddle" means to jump up and down really fast.
  An example sentence:
  ```

- **When to test:** Ask learners to convert a zero-shot prompt into a few-shot prompt for a novel task.

### 4.3 Chain-of-Thought (CoT) Prompting

- Enables **complex reasoning** through intermediate reasoning steps.
- Combine with few-shot prompting for complex tasks requiring reasoning.
- Example with reasoning steps:

  ```
  The odd numbers in this group add up to an even number: 4, 8, 9, 15, 12, 2, 1.
  A: Adding all the odd numbers (9, 15, 1) gives 25. The answer is False.

  The odd numbers in this group add up to an even number: 15, 32, 5, 13, 82, 7, 1.
  A:
  ```

- **Zero-shot CoT:** Simply add "Let's think step by step." to the prompt. This triggers the model to reason through the problem.
- **When to test:** Give learners a reasoning task that fails with direct prompting, then have them add step-by-step reasoning.

### 4.4 Self-Consistency

- Generate multiple reasoning paths and select the most consistent answer.
- Useful for arithmetic and commonsense reasoning tasks.
- **When to test:** Ask learners to design prompts that generate multiple candidate answers and pick the best one.

### 4.5 Prompt Chaining

- Break a complex task into a **sequence of simpler prompts**, each handling one subtask.
- Example: First prompt extracts key facts → second prompt summarizes → third prompt formats output.
- **When to test:** Give learners a multi-step task and ask them to design a chain of prompts.

### 4.6 Tree of Thoughts (ToT)

- Extends CoT by exploring **multiple reasoning branches** and using search/evaluation to pick the best path.
- Each "thought" is a coherent language sequence that serves as an intermediate step.
- The model evaluates its own progress and backtracks when needed.
- **When to test:** Ask learners to design prompts for planning or creative tasks where multiple approaches should be explored.

### 4.7 Retrieval Augmented Generation (RAG)

- Combines prompt generation with **external knowledge retrieval**.
- The prompt includes retrieved context relevant to the query, improving accuracy and reducing hallucination.
- **When to test:** Ask learners to design prompts that incorporate external documents or data sources.

### 4.8 ReAct (Reasoning + Acting)

- Combines **reasoning traces** with **tool use** (e.g., search, calculator, API calls).
- The model alternates between thinking ("Thought:") and acting ("Action:").
- **When to test:** Ask learners to design prompts that use external tools or APIs as part of the response.

### 4.9 Generate Knowledge Prompting

- Ask the model to **generate relevant knowledge** before answering the main question.
- Example: "Generate 3 facts about climate change. Now, using these facts, answer: ..."
- **When to test:** Ask learners to design prompts that first gather knowledge, then use it.

### 4.10 Automatic Prompt Engineer (APE)

- Uses LLMs to **automatically generate and select** optimal prompts.
- Treats prompt generation as a search problem over instruction space.
- **When to test:** Ask learners to think about how they would automate prompt optimization.

### 4.11 Active-Prompt

- Identifies the **most uncertain examples** in a dataset and annotates them with human-labeled demonstrations.
- Focuses annotation effort on the examples that matter most.
- **When to test:** Ask learners to design a strategy for selecting which examples to include in few-shot prompts.

### 4.12 Directional Stimulus Prompting

- Uses a **hint or cue** to guide the model toward the desired response.
- More targeted than general instructions.
- **When to test:** Ask learners to design prompts with specific cues that steer output format or content.

### 4.13 Program-Aided Language Models (PAL)

- Offloads **computational tasks** to a code interpreter.
- The model writes code, then executes it to get the answer.
- **When to test:** Ask learners to design prompts that use code execution for math or data tasks.

### 4.14 Meta Prompting

- Structures prompts around the **abstract structure** of the task rather than specific content.
- Helps the model generalize across domains.
- **When to test:** Ask learners to design prompts that work across multiple domains by focusing on structure.

---

## 5. Prompt Applications

### 5.1 Function Calling

- Design prompts that instruct the model to call specific functions with structured arguments.
- Use JSON schema to define function signatures.
- **When to test:** Ask learners to design prompts that trigger specific function calls.

### 5.2 Code Generation

- Prompts for generating, explaining, or debugging code.
- Include language, constraints, and expected behavior.
- **When to test:** Ask learners to write prompts that generate code in specific languages with constraints.

### 5.3 Text Summarization

- Prompts for condensing long text while preserving key information.
- Specify length, audience, and focus areas.
- **When to test:** Ask learners to design summarization prompts for different audiences.

### 5.4 Question Answering

- **Closed domain:** Answer from a specific text or document.
- **Open domain:** Answer from general knowledge.
- **When to test:** Ask learners to design prompts for both closed and open domain QA.

### 5.5 Information Extraction

- Extract specific entities, relationships, or structured data from text.
- Specify output format (JSON, CSV, etc.).
- **When to test:** Ask learners to design extraction prompts with specific output schemas.

### 5.6 Classification

- Categorize text into predefined classes.
- Zero-shot for simple tasks, few-shot for nuanced ones.
- **When to test:** Ask learners to design classification prompts with edge cases.

### 5.7 Reasoning

- Mathematical, logical, or commonsense reasoning tasks.
- Use CoT or zero-shot CoT ("Let's think step by step").
- **When to test:** Ask learners to design prompts for multi-step reasoning problems.

---

## 6. Risks and Misuses

### 6.1 Adversarial Prompting

- **Prompt Injection:** Malicious input that overrides the original instructions.
- **Prompt Leaking:** Tricks the model into revealing its system prompt or internal instructions.
- **Jailbreaking:** Bypasses safety filters and content restrictions.
- **When to test:** Ask learners to design prompts that are robust against adversarial inputs.

### 6.2 Factuality

- LLMs can generate plausible-sounding but incorrect information (hallucinations).
- Mitigation: Use RAG, ask for sources, verify with external tools.
- **When to test:** Ask learners to design prompts that reduce hallucination risk.

### 6.3 Biases

- LLMs can reflect biases present in training data.
- Mitigation: Explicit instructions for fairness, diverse examples, output validation.
- **When to test:** Ask learners to design prompts that produce fair and unbiased outputs.

---

## 7. LLM Settings That Affect Prompts

| Setting               | Description                                                              | Typical Values        |
| --------------------- | ------------------------------------------------------------------------ | --------------------- |
| **Temperature**       | Controls randomness. Higher = more creative, lower = more deterministic. | 0.0–1.0 (0.7 default) |
| **Top-p**             | Nucleus sampling — controls diversity of output.                         | 0.0–1.0 (1.0 default) |
| **Max Tokens**        | Maximum length of the generated response.                                | Varies by task        |
| **Frequency Penalty** | Reduces repetition of the same tokens.                                   | -2.0 to 2.0           |
| **Presence Penalty**  | Encourages the model to talk about new topics.                           | -2.0 to 2.0           |

**Key insight for problem design:** Problems can teach learners how adjusting these settings changes output quality.

---

## 8. Progression of Skills (for Problem Difficulty)

### Beginner (ELO 0–1199)

- Understand the four elements of a prompt (instruction, context, input, output).
- Write clear, specific instructions.
- Avoid vague language and impreciseness.
- Use zero-shot prompting for simple tasks.
- Basic few-shot prompting with 1–2 examples.

### Intermediate (ELO 1200–1499)

- Design effective few-shot prompts with diverse, representative examples.
- Use chain-of-thought prompting for reasoning tasks.
- Apply prompt chaining for multi-step tasks.
- Handle edge cases and constraints.
- Understand and mitigate common risks (hallucination, bias).

### Expert (ELO 1500+)

- Design robust prompts for complex, multi-domain tasks.
- Use advanced techniques: ToT, ReAct, RAG, PAL.
- Optimize prompts iteratively with evaluation criteria.
- Handle adversarial inputs and ensure prompt safety.
- Design prompts for function calling and tool use.
- Evaluate and compare prompt performance systematically.

---

## 9. Problem Design Principles

When creating practice problems, follow these principles:

### 9.1 Each Problem Teaches One Main Skill

- Don't try to teach everything at once.
- Focus on one technique or concept per problem.
- Build complexity across problems, not within a single problem.

### 9.2 Problems Should Be Grounded in Real Scenarios

- Use industry-specific contexts relevant to the learner.
- Make the problem feel practical, not academic.
- Include realistic inputs and expected outputs.

### 9.3 Test Cases Should Cover Edge Cases

- Include normal cases, edge cases, and failure cases.
- Each test case should test a specific aspect of the prompt.
- Describe what's being tested and why it matters.

### 9.4 Pro Tips Should Be Actionable

- Give concrete, specific advice.
- Reference techniques from this knowledge base.
- Explain why the tip works, not just what to do.

### 9.5 Difficulty Should Match Learner Level

- **Beginner:** Focus on clarity, specificity, basic structure.
- **Intermediate:** Focus on reasoning, few-shot design, constraints.
- **Expert:** Focus on robustness, advanced techniques, evaluation.

---

## 10. Common Prompt Anti-Patterns to Test Against

When designing problems, include these anti-patterns as things learners should fix:

1. **Vague instruction:** "Write something about X" → No clear task.
2. **Missing context:** No audience, domain, or background information.
3. **No output format:** The model doesn't know how to structure the response.
4. **Negative-only instructions:** "Don't do X" without saying what to do instead.
5. **Overly long prompts:** Too much unnecessary detail that confuses the model.
6. **No examples for complex tasks:** Expecting the model to figure out a novel task without demonstrations.
7. **No constraints:** No word limits, format requirements, or quality criteria.
8. **Mixed instructions:** Multiple conflicting tasks in one prompt.
9. **Assuming model knowledge:** Not providing necessary domain context.
10. **No evaluation criteria:** No way to judge if the output is good.

---

## 11. Example Problem Templates by Level

### Beginner Template

```
Task: Improve a vague prompt by adding clear instruction, context, and output format.
Given: A vague one-liner (e.g., "Tell me about pricing.")
Requirements:
  1. Add a clear instruction (what the model should do)
  2. Add relevant context (audience, domain, scope)
  3. Specify the output format
  4. Keep the final prompt under 80 words
Evaluation: Clarity of instruction, relevance of context, specificity of output format.
```

### Intermediate Template

```
Task: Design a few-shot prompt for a novel task.
Given: A task description and 2–3 input examples.
Requirements:
  1. Create demonstrations that show the expected format
  2. Ensure label distribution matches the expected input distribution
  3. Add a chain-of-thought step if reasoning is needed
  4. Handle at least one edge case in the examples
Evaluation: Quality of demonstrations, format consistency, edge case handling.
```

### Expert Template

```
Task: Design a robust prompt for a multi-step task with tool use.
Given: A complex scenario requiring reasoning and external data.
Requirements:
  1. Use prompt chaining or ReAct pattern
  2. Include error handling for tool failures
  3. Add evaluation criteria for each step
  4. Make the prompt resilient to adversarial inputs
Evaluation: Correctness of reasoning chain, tool integration quality, robustness.
```

---

## 12. Scoring Rubric Reference

When evaluating learner prompts, use these criteria:

| Criterion           | Weight | What to Look For                                                   |
| ------------------- | ------ | ------------------------------------------------------------------ |
| **Task Clarity**    | 25%    | Is the instruction specific and unambiguous?                       |
| **Context Quality** | 20%    | Is the context relevant and helpful? Not too much, not too little. |
| **Constraints**     | 20%    | Are there clear boundaries (length, format, scope)?                |
| **Output Format**   | 15%    | Is the expected output clearly specified?                          |
| **Examples**        | 10%    | Are there demonstrations for complex tasks?                        |
| **Robustness**      | 10%    | Would the prompt handle edge cases and variations?                 |

---

## 13. Key References

- Wei et al. (2022) — Chain-of-Thought Prompting
- Kojima et al. (2022) — Zero-Shot CoT ("Let's think step by step")
- Brown et al. (2020) — Few-Shot Learning in Language Models
- Touvron et al. (2023) — LLaMA and few-shot properties
- Min et al. (2022) — Rethinking the Role of Demonstrations
- Zhang et al. (2022) — Automatic Chain-of-Thought (Auto-CoT)
- Yao et al. (2022) — Tree of Thoughts
- Yao et al. (2022) — ReAct Prompting
- Gao et al. (2022) — PAL: Program-Aided Language Models
- Lewis et al. (2020) — Retrieval Augmented Generation (RAG)

---

**END OF KNOWLEDGE BASE**

> **Reminder for the AI:** When generating practice problems, ALWAYS reference this knowledge base. Each problem should:
>
> 1. Teach or reinforce a concept from Sections 2–6.
> 2. Match the learner's level per Section 8.
> 3. Follow the design principles in Section 9.
> 4. Test against anti-patterns in Section 10.
> 5. Use the appropriate template from Section 11.
> 6. Be scorable using the rubric in Section 12.
