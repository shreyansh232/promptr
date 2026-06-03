"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CircleNotch, TerminalWindow, X } from "@phosphor-icons/react";

interface NewScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (agentDescription: string, tools: string) => Promise<void>;
  isLoading: boolean;
}

export function NewScenarioModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: NewScenarioModalProps) {
  const [agentDescription, setAgentDescription] = useState("");
  const [tools, setTools] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentDescription.trim()) return;
    await onSubmit(agentDescription, tools);
    setAgentDescription("");
    setTools("");
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isLoading && onClose()}
    >
      <DialogContent className="max-w-xl rounded-none border border-white/10 bg-[#111111] p-0 text-[#f5efe6] shadow-[0_30px_80px_rgba(0,0,0,0.5)] sm:rounded-none">
        <DialogHeader className="px-6 py-5">
          <DialogTitle className="font-mono text-xl font-semibold tracking-tight text-[#f5efe6]">
            Create Custom Prompt Test
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs text-[#a0978a]">
            Specify your agent&apos;s objective and tools. We will dynamically
            generate adversarial scenarios and test cases for evaluating your
            instructions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-6 font-mono text-xs">
            <div className="space-y-2">
              <Label
                htmlFor="agent-desc"
                className="text-[10px] font-semibold text-[#abb4a4]"
              >
                Agent Description / Core Instructions
              </Label>
              <Textarea
                id="agent-desc"
                value={agentDescription}
                onChange={(e) => setAgentDescription(e.target.value)}
                placeholder="Examples: A customer support assistant for order returns. Refuses items bought > 30 days ago. Greets user by name."
                className="min-h-[100px] rounded-none border-white/10 bg-[#0d0d0d] font-mono text-xs text-[#f5efe6] placeholder:text-[#4a453d] focus-visible:ring-[#48d8a4]/50"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="tools-desc"
                className="text-[10px] font-semibold text-[#abb4a4]"
              >
                Available Tools (Optional)
              </Label>
              <Textarea
                id="tools-desc"
                value={tools}
                onChange={(e) => setTools(e.target.value)}
                placeholder="Examples: check_order_date(order_id), approve_return(order_id), escalate_to_human(reason)"
                className="min-h-[80px] rounded-none border-white/10 bg-[#0d0d0d] font-mono text-xs text-[#f5efe6] placeholder:text-[#4a453d] focus-visible:ring-[#48d8a4]/50"
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter className="flex-row justify-end gap-3 px-6 py-4 sm:space-x-0">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-none border border-[#ff3b30] bg-[#ff3b30]/10 font-mono text-xs text-[#ff8b8b] hover:bg-[#ff3b30]/20 hover:text-[#ff8b8b]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !agentDescription.trim()}
              className="rounded-none bg-[#48d8a4] font-mono text-sm font-bold text-[#10110f] hover:bg-[#62e2b7] disabled:bg-white/10 disabled:text-[#4a453d]"
            >
              {isLoading ? "Creating prompt test..." : "Create prompt test"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
