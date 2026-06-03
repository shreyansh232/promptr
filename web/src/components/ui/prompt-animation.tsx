"use client";
import React, { useState, useEffect } from "react";
import { ArrowRight, Smiley, SmileySad } from "@phosphor-icons/react";

const prompts: [string, string][] = [
  ["Write me an essay", "Write me a well-structured essay on climate change"],
  ["Make website", "Create a responsive website using React and Tailwind CSS"],
  ["How to cook", "Explain how to cook a gourmet Italian pasta dish"],
  [
    "What is AI",
    "Explain the fundamentals and applications of artificial intelligence",
  ],
  ["Tell joke", "Share a clever and original joke about programming"],
];

const getEmojiForPrompt = (isImproved: boolean) => {
  return isImproved ? (
    <Smiley className="h-5 w-5 text-[#ff8a3d]" weight="fill" />
  ) : (
    <SmileySad className="h-5 w-5 text-white/40" weight="fill" />
  );
};

const TypewriterPrompt = () => {
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [promptIndex, setPromptIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isImproved, setIsImproved] = useState(false);

  useEffect(() => {
    const currentPromptPair = prompts[promptIndex % prompts.length] ?? ["", ""];
    const currentPromptText = isImproved
      ? currentPromptPair[1]
      : currentPromptPair[0];

    if (charIndex < currentPromptText.length) {
      const timer = setTimeout(() => {
        setCurrentPrompt((prev) => prev + currentPromptText[charIndex]);
        setCharIndex(charIndex + 1);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        if (!isImproved) {
          setIsImproved(true);
          setCurrentPrompt("");
          setCharIndex(0);
        } else {
          setIsImproved(false);
          setCurrentPrompt("");
          setCharIndex(0);
          setPromptIndex((prevIndex) => (prevIndex + 1) % prompts.length);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [charIndex, promptIndex, isImproved]);

  return (
    <div className="mt-4 flex w-full items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60">
      <span className="mr-2 text-white">{currentPrompt}</span>
      <span className="ml-auto flex items-center">
        {getEmojiForPrompt(isImproved)}
        <ArrowRight className="ml-2 h-4 w-4 text-[#ff8a3d]" />
      </span>
    </div>
  );
};

export default TypewriterPrompt;
