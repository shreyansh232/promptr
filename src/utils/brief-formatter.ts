interface ParsedBrief {
  intro: string;
  points: string[];
}

export function parseBrief(brief: string | null | undefined): ParsedBrief {
  if (!brief) {
    return { intro: "", points: [] };
  }

  // Helper to split into sentences
  const splitIntoSentences = (text: string): string[] => {
    const processed = text
      .replace(/e\.g\./gi, "e___g___")
      .replace(/i\.e\./gi, "i___e___")
      .replace(/vs\./gi, "vs___");
      
    // Split by period, exclamation, or question mark followed by space or end
    const segments = processed.split(/(?<=[.!?])\s+/);
    return segments.map(s => 
      s.replace(/e___g___/g, "e.g.")
       .replace(/i___e___/g, "i.e.")
       .replace(/vs___/g, "vs.")
    );
  };

  const cleanSentence = (s: string): string => {
    let cleaned = s.trim();
    if (cleaned.endsWith(",")) {
      cleaned = cleaned.slice(0, -1).trim();
    }
    if (cleaned && !/[.!?]$/.test(cleaned)) {
      cleaned += ".";
    }
    if (cleaned) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    return cleaned;
  };

  // If it already contains explicit newlines, let's parse line by line
  if (brief.includes("\n")) {
    const lines = brief.split("\n").map(l => l.trim()).filter(Boolean);
    const introLines: string[] = [];
    const points: string[] = [];
    
    lines.forEach(line => {
      // Check if it has bullet indicators: - or * or numbers like 1.
      if (/^([-*\d.]+)\s+(.*)/.test(line)) {
        points.push(line.replace(/^[-*\d.]+\s+/, ""));
      } else {
        if (points.length === 0) {
          introLines.push(line);
        } else {
          points.push(line);
        }
      }
    });
    
    return { 
      intro: introLines.join("\n"), 
      points 
    };
  }

  // Check for parenthesized numbers: (1), (2), etc.
  if (/\(\d+\)/.test(brief)) {
    const parts = brief.split(/\(\d+\)/);
    const rawIntro = parts[0];
    let intro = rawIntro ? rawIntro.trim() : "";
    if (intro.endsWith(":")) {
      intro = intro.slice(0, -1).trim();
    }

    const points: string[] = [];
    for (let i = 1; i < parts.length; i++) {
      const rawPart = parts[i];
      if (rawPart === undefined) continue;
      const partText = rawPart.trim();
      if (!partText) continue;

      const sentences = splitIntoSentences(partText);
      if (sentences.length > 0) {
        const firstSentence = sentences[0];
        if (firstSentence !== undefined) {
          const firstItem = cleanSentence(firstSentence);
          if (firstItem) points.push(firstItem);
        }

        for (let j = 1; j < sentences.length; j++) {
          const extraSentence = sentences[j];
          if (extraSentence !== undefined) {
            const extraItem = cleanSentence(extraSentence);
            if (extraItem) points.push(extraItem);
          }
        }
      }
    }

    return { intro, points };
  }

  // If no parenthesized numbers, but it has multiple sentences, split them
  const sentences = splitIntoSentences(brief);
  const firstSentence = sentences[0];
  if (sentences.length > 1 && brief.length > 100 && firstSentence !== undefined) {
    const intro = cleanSentence(firstSentence);
    const points: string[] = [];
    for (let i = 1; i < sentences.length; i++) {
      const itemText = sentences[i];
      if (itemText !== undefined) {
        const item = cleanSentence(itemText);
        if (item) points.push(item);
      }
    }
    return { intro, points };
  }

  // Otherwise, just show the entire brief as the intro with no bullet points
  return { intro: brief, points: [] };
}
