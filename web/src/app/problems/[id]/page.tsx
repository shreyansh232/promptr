"use client";

import { useParams } from "next/navigation";
import { ProblemDescription } from "@/components/playground/problem-description";
import { ProblemSidebar } from "@/components/playground/problem-sidebar";
import { PromptEditor } from "@/components/playground/prompt-editor";
import { problems, problemsList } from "@/data/problems";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { notFound } from "next/navigation";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ProblemPage() {
  const params = useParams<{ id: string }>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const problem = problems[Number(params.id)];

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
      {isMobile && !isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed bottom-6 left-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#ff8a3d] text-black shadow-[0_4px_20px_rgba(255,138,61,0.4)] hover:bg-[#ff9b5b] transition-all hover:scale-105 active:scale-95"
          title="View Problems"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
      <ResizablePanelGroup direction={isMobile ? "vertical" : "horizontal"} className="flex">
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
