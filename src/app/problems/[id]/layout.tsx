import type { Metadata } from "next";
import { problems } from "@/data/problems";

interface Props {
  children: React.ReactNode;
  params: { id: string };
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const problemId = Number(params.id);
  const problem = problems[problemId];
  if (!problem) {
    return {
      title: "Problem Not Found",
    };
  }

  return {
    title: `${problem.title}`,
    description: `Solve the "${problem.title}" prompt engineering challenge. Learn to instruct AI agents for e-commerce, code analysis, email response composition, and more.`,
  };
}

export default function ProblemLayout({ children }: Props) {
  return <>{children}</>;
}
