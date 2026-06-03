import type { Problem } from "@/types/problem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { parseBrief } from "@/lib/brief-formatter";

interface ProblemDescriptionProps {
  problem: Problem;
}

export function ProblemDescription({ problem }: ProblemDescriptionProps) {
  return (
    <div className="scroll-none h-full overflow-auto">
      <div className="space-y-4 p-4">
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
        <Card className="border border-white/10 bg-white/5 text-white">
          <CardHeader>
            <CardTitle className="text-2xl">Problem Description</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            {(() => {
              const { intro, points } = parseBrief(problem.description);
              return (
                <div className="text-sm leading-6 text-white/90">
                  {intro && <p className="mb-2 font-medium text-white">{intro}</p>}
                  {points.length > 0 && (
                    <ul className="list-inside list-disc space-y-1.5 pl-1 text-white/80">
                      {points.map((pt, idx) => (
                        <li key={idx} className="leading-6">
                          {pt}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })()}
          </CardContent>
        </Card>
        {problem.examples.map((example, index) => (
          <Card
            key={index}
            className="border border-white/10 bg-white/5 text-white"
          >
            <CardHeader>
              <CardTitle className="text-2xl">Example {index + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="font-mono text-sm text-white/70">Input:</div>
                <div className="rounded-md border border-white/10 bg-black/40 p-4 font-mono">
                  {example.input}
                </div>
              </div>
              <div>
                <div className="font-mono text-sm text-white/70">Output:</div>
                <div className="rounded-md border border-white/10 bg-black/40 p-4 font-mono">
                  {example.output}
                </div>
              </div>
              {example.explanation && (
                <div>
                  <div className="font-mono text-sm text-white/70">
                    Explanation:
                  </div>
                  <div className="rounded-md border border-white/10 bg-black/40 p-4">
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
