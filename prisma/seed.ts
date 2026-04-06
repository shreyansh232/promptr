import { PrismaClient, Difficulty } from "@prisma/client";

const prisma = new PrismaClient();

const problemsData = [
  {
    title: "Product Description Generator",
    difficulty: Difficulty.EASY,
    description: `Create a prompt that generates compelling product descriptions for e-commerce listings. The prompt should:

1. Extract key product features and specifications
2. Generate engaging marketing copy
3. Include relevant keywords for SEO
4. Maintain a consistent brand voice
5. Be adaptable for different product categories

Your prompt will be tested with various product types and evaluated based on the quality and consistency of the generated descriptions.`,
    goal: "Generate highly converting product descriptions that include all key specs and maintain a specific brand voice.",
    proTips: ["Be specific about the tone", "Tell the LLM to structure the output for better SEO"],
    examples: [
      {
        input: "Wireless Bluetooth Earbuds, 24-hour battery life, water-resistant, noise-cancelling",
        output: "Experience uninterrupted music with these premium wireless earbuds...",
        explanation: "Good transformation from technical specs to copy."
      }
    ],
    testCases: [
      {
        input: "Yoga Mat, eco-friendly materials, non-slip surface, 6mm thick, includes carrying strap",
        expectedOutput: "A description that emphasizes eco-friendliness, comfort, and practical features",
        description: "Tests the prompt's ability to market fitness equipment"
      },
      {
        input: "Smart Coffee Maker, programmable, 12-cup capacity, built-in grinder, thermal carafe",
        expectedOutput: "A description that highlights convenience features and appeals to coffee enthusiasts",
        description: "Tests the prompt's ability to market kitchen appliances"
      }
    ]
  },
  {
    title: "Code Explanation Assistant",
    difficulty: Difficulty.MEDIUM,
    description: `Create a prompt that generates clear and concise explanations for code snippets. The prompt should:

1. Analyze the given code snippet and identify its purpose
2. Explain the code's functionality in simple terms
3. Highlight key programming concepts used in the code
4. Provide examples of how the code might be used
5. Suggest potential improvements or alternative approaches`,
    goal: "Make complex code understandable for junior developers while providing actionable optimization advice.",
    proTips: ["Suggest using a line-by-line format", "Mention the specific programming language if known"],
    examples: [
      {
        input: "def fibonacci(n): if n <= 1: return n else: return fibonacci(n-1) + fibonacci(n-2)",
        output: "This code defines a recursive function to calculate the nth Fibonacci number.",
        explanation: "Breaks down recursion clearly."
      }
    ],
    testCases: [
      {
        input: "function quickSort(arr) { ... }",
        expectedOutput: "An explanation that covers the QuickSort algorithm",
        description: "Tests the prompt's ability to explain sorting algorithms"
      }
    ]
  }
];

async function main() {
  console.log("Seeding problems...");

  for (const p of problemsData) {
    const { testCases, ...problemData } = p;
    const createdProblem = await prisma.problem.create({
      data: {
        ...problemData,
        testCases: {
          create: testCases
        }
      }
    });
    console.log(`Created problem: ${createdProblem.title}`);
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
