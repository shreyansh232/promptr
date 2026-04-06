"use client";

import { useParams } from "next/navigation";
import { ProblemDescription } from "@/components/problem-description";
import { ProblemSidebar } from "@/components/problem-sidebar";
import { PromptEditor } from "@/components/prompt-editor";
import { problems, problemsList } from "@/data/problems";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { notFound } from "next/navigation";
import { useState } from "react";

export default function ProblemPage() {
  const params = useParams<{ id: string }>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const problem = problems[Number(params.id) as keyof typeof problems];

  if (!problem) {
    notFound();
  }

  return (
    <div className="fixed inset-0 flex h-screen w-screen bg-gray-900">
      <ProblemSidebar
        problems={problemsList}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <ResizablePanelGroup direction="horizontal" className="flex">
        <ResizablePanel defaultSize={50} className="overflow-auto">
          <ProblemDescription problem={problem} />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={50} className="overflow-auto">
          <PromptEditor testCases={problem.testCases} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
