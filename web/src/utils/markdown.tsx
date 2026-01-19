import React from 'react';

export const parseMarkdown = (text: string): React.ReactNode => {
  // Define markdown patterns in order of priority
  const patterns = [
    // Bold: **text**
    { 
      regex: /\*\*(.+?)\*\*/g, 
      render: (content: string, key: number) => <strong key={key}>{content}</strong> 
    },
    // Italic: *text*
    { 
      regex: /\*(.+?)\*/g, 
      render: (content: string, key: number) => <em key={key}>{content}</em> 
    },
    // Underline: __text__
    { 
      regex: /__(.+?)__/g, 
      render: (content: string, key: number) => <u key={key}>{content}</u> 
    },
    // Strikethrough: ~~text~~
    { 
      regex: /~~(.+?)~~/g, 
      render: (content: string, key: number) => <del key={key}>{content}</del> 
    },
    // Code/monospace: `text`
    { 
      regex: /`(.+?)`/g, 
      render: (content: string, key: number) => (
        <code key={key} className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">
          {content}
        </code>
      ) 
    }
  ];

  const result: React.ReactNode[] = [];

  // Find all matches for all patterns
  const allMatches: Array<{
    index: number;
    length: number;
    content: React.ReactNode;
  }> = [];

  patterns.forEach((pattern) => {
    let match;
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    
    while ((match = regex.exec(text)) !== null) {
      allMatches.push({
        index: match.index,
        length: match[0].length,
        content: pattern.render(match[1], allMatches.length)
      });
    }
  });

  // Sort matches by index to process them in order
  allMatches.sort((a, b) => a.index - b.index);

  // Remove overlapping matches (keep the first one)
  const nonOverlappingMatches = [];
  let lastEndIndex = -1;
  
  for (const match of allMatches) {
    if (match.index >= lastEndIndex) {
      nonOverlappingMatches.push(match);
      lastEndIndex = match.index + match.length;
    }
  }

  // Build the result
  let lastIndex = 0;
  
  nonOverlappingMatches.forEach((match) => {
    // Add text before this match
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index));
    }
    
    // Add the formatted content
    result.push(match.content);
    
    lastIndex = match.index + match.length;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result.length === 0 ? text : (result.length === 1 && typeof result[0] === 'string' ? result[0] : result);
};

export const highlightTextInString = (text: string, query: string): React.ReactNode => {
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  if (parts.length === 1) return text;
  
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <span key={i} className="bg-yellow-200 text-black rounded px-0.5">
        {part}
      </span>
    ) : (
      part
    )
  );
};

export const parseMarkdownWithHighlights = (line: string, query: string): React.ReactNode => {
  if (!query) return parseMarkdown(line);

  // First parse markdown, then apply highlights
  const markdownContent = parseMarkdown(line);
  
  // If markdown parsing returned just text, apply highlights
  if (typeof markdownContent === 'string') {
    return highlightTextInString(markdownContent, query);
  }
  
  // If markdown parsing returned React elements, we need to traverse and highlight
  // For now, let's highlight the original text and skip markdown when searching
  // This is a simplified approach - a full implementation would need recursive highlighting
  return highlightTextInString(line, query);
};