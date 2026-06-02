"use client";

import { cn } from "@/lib/utils";
import type { ProblemsListItem } from "@/types/problem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider
} from "@/components/ui/sidebar";

interface ProblemSidebarProps {
  problems: ProblemsListItem[];
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export function ProblemSidebar({ problems, isSidebarOpen, setIsSidebarOpen }: ProblemSidebarProps) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
    <motion.div
      initial={false}
      animate={{
        width: isSidebarOpen ? "240px" : "60px",
        transition: { duration: 0.3 },
      }}
      className="overflow-hidden border-r border-white/10 bg-black"
    >
      <Sidebar className={`h-full bg-black ${isSidebarOpen ? "w-[400px]" : "w-[80px]"}`}>
        <SidebarHeader className="border-b border-white/10 bg-black p-4">
          <div className="flex items-center justify-between">
            <h2 className={`text-lg font-semibold ${!isSidebarOpen && "hidden"} text-white`}>
              Problems
            </h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-white/70 hover:text-white"
            >
              {isSidebarOpen ? <CaretLeft size={20} /> : <CaretRight size={20} />}
            </motion.button>
          </div>
        </SidebarHeader>

        <SidebarContent className="bg-black py-4">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {problems.map((problem) => (
                  <SidebarMenuItem key={problem.id}>
                    <Link href={`/problems/${problem.id}`}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-between px-4 py-2 hover:bg-white/5 flex text-white/70 hover:text-white",
                          pathname === `/problems/${problem.id}` && "bg-white/5 text-white"
                        )}
                      >
                        {isSidebarOpen ? (
                          <>
                            <span className="flex items-center gap-2">
                              <span className="text-sm">
                                {problem.id}. {problem.title}
                              </span>
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  problem.difficulty === "Easy"
                                    ? "default"
                                    : problem.difficulty === "Medium"
                                      ? "secondary"
                                      : "destructive"
                                }
                                className="text-[10px] px-1.5 py-0.5"
                              >
                                {problem.difficulty}
                              </Badge>
                              {problem.solved && (
                                <CheckCircle className="h-4 w-4 text-[#ff8a3d]" weight="fill" />
                              )}
                            </div>
                          </>
                        ) : (
                          <span className="text-sm text-white/70 text-center items-center w-full">{problem.id}</span>
                        )}
                      </Button>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </motion.div>
    </SidebarProvider>
  );
}