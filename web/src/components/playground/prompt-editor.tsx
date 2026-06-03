"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TestCase } from "@/types/problem";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "@phosphor-icons/react";

interface PromptEditorProps {
  testCases: TestCase[];
}

export function PromptEditor({ testCases }: PromptEditorProps) {
  const [prompt, setPrompt] = useState("");
  const [results, setResults] = useState<
    { success: boolean; output: string }[]
  >([]);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    // Simulate API call to test the prompt
    const simulatedResults = testCases.map((_testCase) => ({
      success: Math.random() > 0.5,
      output: "Generated output would appear here...",
    }));

    // Artificial delay to simulate processing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setResults(simulatedResults);
    setIsRunning(false);
  };

  return (
    <div className="flex h-full flex-col bg-black p-4">
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Write your prompt here..."
        className="mb-4 h-1/2 min-h-[450px] flex-1 resize-none rounded-xl border border-white/10 bg-white/5 font-mono text-white placeholder-white/30 focus:border-primary/50 focus:outline-none focus:ring-0"
      />
      <div className="scroll-none flex-1 space-y-4 overflow-auto">
        {testCases.map((testCase, index) => (
          <Card
            key={index}
            className="scroll-none border border-white/10 bg-white/5 text-white"
          >
            <CardHeader className="py-3">
              <CardTitle className="text-sm font-medium">
                Test Case {index + 1}
                {results[index] && (
                  <Badge
                    variant={results[index].success ? "default" : "destructive"}
                    className="ml-2"
                  >
                    {results[index].success ? (
                      <CheckCircle
                        className="mr-1 h-3 w-3 text-black"
                        weight="fill"
                      />
                    ) : (
                      <XCircle className="mr-1 h-3 w-3" weight="fill" />
                    )}
                    {results[index].success ? "Passed" : "Failed"}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 text-sm">
              <div className="space-y-2">
                <div>
                  <div className="mb-1 font-mono text-xs text-white/75">
                    Input:
                  </div>
                  <div className="rounded-md border border-white/10 bg-black/40 p-2 font-mono text-white/95">
                    {testCase.input}
                  </div>
                </div>
                {results[index] && (
                  <div>
                    <div className="font-mono text-xs text-white/75">
                      Output:
                    </div>
                    <div className="rounded-md border border-white/10 bg-black/40 p-2 font-mono text-white/95">
                      {results[index].output}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-4">
        <Button
          onClick={runTests}
          className="w-full rounded-full bg-[#ff8a3d] py-6 font-semibold text-black hover:bg-[#ff9b5b]"
          disabled={!prompt.trim() || isRunning}
        >
          {isRunning ? "Running Tests..." : "Run Test Cases"}
        </Button>
      </div>
    </div>
  );
}
