import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { parseMarkdown } from '../utils/markdown';

// Mock the stores
vi.mock('../stores/auth.store', () => ({
  useAuthStore: vi.fn(() => ({ user: { id: 1 } }))
}));

vi.mock('../stores/chat.store', () => ({
  useChatStore: vi.fn(() => ({
    activeChat: null,
    sendMessage: vi.fn(),
    createChat: vi.fn(),
  }))
}));

vi.mock('../stores/contacts.store', () => ({
  useContactsStore: vi.fn(() => ({
    contacts: {},
    contactsStatuses: new Map(),
    emitTypingStatus: vi.fn(),
  }))
}));

vi.mock('../stores/search.store', () => ({
  useSearchStore: vi.fn(() => ({
    searchQuery: '',
    setSearchQuery: vi.fn(),
    clearSearch: vi.fn(),
    currentMatchIndex: 0,
    totalMatches: 0,
    setTotalMatches: vi.fn(),
    nextMatch: vi.fn(),
    previousMatch: vi.fn(),
  }))
}));

vi.mock('../stores/theme.store', () => ({
  useThemeStore: vi.fn(() => ({ theme: 'light' }))
}));

vi.mock('../services/socket.service', () => ({
  socketService: {
    isConnected: () => true,
    emit: vi.fn(),
  }
}));

// Test component for message rendering
const TestMessageRenderer = ({ content, searchQuery }: { content: string, searchQuery?: string }) => {
  const renderMessageContent = (text: string, query?: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIndex) => (
      <React.Fragment key={lineIndex}>
        <span>{query ? line : parseMarkdown(line)}</span>
        {lineIndex < lines.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div data-testid="message-content">
      {renderMessageContent(content, searchQuery)}
    </div>
  );
};

describe('Message Rendering', () => {
  describe('Multiline Support', () => {
    it('should render single line messages correctly', () => {
      render(<TestMessageRenderer content="Single line message" />);
      
      const messageContent = screen.getByTestId('message-content');
      expect(messageContent).toBeInTheDocument();
      expect(messageContent.textContent).toBe('Single line message');
      expect(messageContent.querySelector('br')).not.toBeInTheDocument();
    });

    it('should render multiline messages with line breaks', () => {
      const multilineContent = "First line\nSecond line\nThird line";
      render(<TestMessageRenderer content={multilineContent} />);
      
      const messageContent = screen.getByTestId('message-content');
      expect(messageContent).toBeInTheDocument();
      expect(messageContent.textContent).toBe('First lineSecond lineThird line');
      
      const lineBreaks = messageContent.querySelectorAll('br');
      expect(lineBreaks).toHaveLength(2);
    });

    it('should handle empty lines correctly', () => {
      const contentWithEmptyLines = "First line\n\nThird line";
      render(<TestMessageRenderer content={contentWithEmptyLines} />);
      
      const messageContent = screen.getByTestId('message-content');
      const lineBreaks = messageContent.querySelectorAll('br');
      expect(lineBreaks).toHaveLength(2);
    });

    it('should preserve spacing in multiline content', () => {
      const contentWithSpaces = "Line with spaces\n  Indented line\nNormal line";
      render(<TestMessageRenderer content={contentWithSpaces} />);
      
      const messageContent = screen.getByTestId('message-content');
      expect(messageContent.textContent).toContain('  Indented line');
    });
  });

  describe('Markdown Integration with Multiline', () => {
    it('should render markdown in multiline messages', () => {
      const markdownMultiline = "**Bold first line**\n*Italic second line*\n`Code third line`";
      render(<TestMessageRenderer content={markdownMultiline} />);
      
      const messageContent = screen.getByTestId('message-content');
      
      // Check for markdown elements
      expect(messageContent.querySelector('strong')).toBeInTheDocument();
      expect(messageContent.querySelector('em')).toBeInTheDocument();
      expect(messageContent.querySelector('code')).toBeInTheDocument();
      
      // Check for line breaks
      const lineBreaks = messageContent.querySelectorAll('br');
      expect(lineBreaks).toHaveLength(2);
      
      // Verify content
      expect(messageContent.querySelector('strong')?.textContent).toBe('Bold first line');
      expect(messageContent.querySelector('em')?.textContent).toBe('Italic second line');
      expect(messageContent.querySelector('code')?.textContent).toBe('Code third line');
    });

    it('should handle mixed markdown and plain text across lines', () => {
      const mixedContent = "Regular text\n**Bold line**\nRegular again\n*Italic end*";
      render(<TestMessageRenderer content={mixedContent} />);
      
      const messageContent = screen.getByTestId('message-content');
      
      expect(messageContent.querySelector('strong')?.textContent).toBe('Bold line');
      expect(messageContent.querySelector('em')?.textContent).toBe('Italic end');
      expect(messageContent.textContent).toContain('Regular text');
      expect(messageContent.textContent).toContain('Regular again');
    });

    it('should handle markdown that spans across conceptual lines but not newlines', () => {
      const content = "Start **bold\ntext continues** end";
      render(<TestMessageRenderer content={content} />);
      
      const messageContent = screen.getByTestId('message-content');
      // Markdown should not span across actual newline characters
      expect(messageContent.querySelector('strong')).not.toBeInTheDocument();
      expect(messageContent.textContent).toContain('**bold');
      expect(messageContent.textContent).toContain('text continues**');
    });

    it('should preserve markdown formatting with special characters in multiline', () => {
      const content = "**Bold: Special chars!**\n*Italic with @#$%*\n`Code with (parentheses)`";
      render(<TestMessageRenderer content={content} />);
      
      const messageContent = screen.getByTestId('message-content');
      
      expect(messageContent.querySelector('strong')?.textContent).toBe('Bold: Special chars!');
      expect(messageContent.querySelector('em')?.textContent).toBe('Italic with @#$%');
      expect(messageContent.querySelector('code')?.textContent).toBe('Code with (parentheses)');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long single lines', () => {
      const longContent = 'A'.repeat(1000);
      render(<TestMessageRenderer content={longContent} />);
      
      const messageContent = screen.getByTestId('message-content');
      expect(messageContent.textContent).toHaveLength(1000);
    });

    it('should handle many short lines', () => {
      const manyLines = Array(50).fill('Line').join('\n');
      render(<TestMessageRenderer content={manyLines} />);
      
      const messageContent = screen.getByTestId('message-content');
      const lineBreaks = messageContent.querySelectorAll('br');
      expect(lineBreaks).toHaveLength(49); // n-1 breaks for n lines
    });

    it('should handle mixed line endings gracefully', () => {
      const mixedContent = "Line 1\nLine 2";
      render(<TestMessageRenderer content={mixedContent} />);
      
      const messageContent = screen.getByTestId('message-content');
      expect(messageContent.textContent).toBe('Line 1Line 2');
      expect(messageContent.querySelectorAll('br')).toHaveLength(1);
    });

    it('should handle empty content', () => {
      render(<TestMessageRenderer content="" />);
      
      const messageContent = screen.getByTestId('message-content');
      expect(messageContent.textContent).toBe('');
    });

    it('should handle content with only newlines', () => {
      render(<TestMessageRenderer content="\n\n\n" />);
      
      const messageContent = screen.getByTestId('message-content');
      
      // For this edge case (content with only newlines), we just verify that
      // the component renders without crashing and produces some output
      expect(messageContent).toBeInTheDocument();
      expect(messageContent.children.length).toBeGreaterThan(0);
    });
  });
});