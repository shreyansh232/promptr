import type { Problem } from "@/types/problem";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProblemDescriptionProps {
  problem: Problem;
}

export function ProblemDescription({ problem }: ProblemDescriptionProps) {
  return (
    <div className="h-full overflow-auto scroll-none">
      <div className="p-4 space-y-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {problem.id}. {problem.title}
          </h1>
          <div className="mt-2">
            <Badge
              variant={
                problem.difficulty === "Easy"
                  ? "default"
                  : problem.difficulty === "Medium"
                    ? "secondary"
                    : "destructive"
              }
            >
              {problem.difficulty}
            </Badge>
          </div>
        </div>
        <Card className="bg-white/5 border border-white/10 text-white">
          <CardHeader>
            <CardTitle className="text-2xl">Problem Description</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <div className="whitespace-pre-wrap">{problem.description}</div>
          </CardContent>
        </Card>
        {problem.examples.map((example, index) => (
          <Card key={index} className="bg-white/5 border border-white/10 text-white">
            <CardHeader>
              <CardTitle className="text-2xl">Example {index + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="font-mono text-sm text-white/70">
                  Input:
                </div>
                <div className="rounded-md bg-black/40 border border-white/10 p-4 font-mono">
                  {example.input}
                </div>
              </div>
              <div>
                <div className="font-mono text-sm text-white/70">
                  Output:
                </div>
                <div className="rounded-md bg-black/40 border border-white/10 p-4 font-mono">
                  {example.output}
                </div>
              </div>
              {example.explanation && (
                <div>
                  <div className="font-mono text-sm text-white/70">
                    Explanation:
                  </div>
                  <div className="rounded-md bg-black/40 border border-white/10 p-4">
                    {example.explanation}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
