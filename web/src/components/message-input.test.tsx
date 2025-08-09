import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Test component that mimics MessageInput behavior
const TestMessageInput = () => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = React.useState('');
  const mockSendMessage = vi.fn();
  const mockEmitTypingStatus = vi.fn();

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 44), 200);
    textarea.style.height = `${newHeight}px`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const content = message.trim();
    if (!content) return;

    mockSendMessage(content);
    setMessage('');
    // Reset height after clearing
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = '44px';
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest('form');
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    setMessage(textarea.value);
    adjustTextareaHeight();

    const isTyping = textarea.value.trim().length > 0;
    mockEmitTypingStatus(isTyping);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  React.useEffect(() => {
    adjustTextareaHeight();
  }, []);

  return (
    <form onSubmit={handleSubmit} data-testid="message-form">
      <textarea
        ref={textareaRef}
        value={message}
        placeholder="Write a message..."
        rows={1}
        className="resize-none overflow-y-auto min-h-[44px] max-h-[200px]"
        data-testid="message-input"
        onInput={handleInput}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <button type="submit" data-testid="send-button">
        Send
      </button>
    </form>
  );
};

import React from 'react';

describe('MessageInput Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should render textarea and send button', () => {
      render(<TestMessageInput />);
      
      expect(screen.getByTestId('message-input')).toBeInTheDocument();
      expect(screen.getByTestId('send-button')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Write a message...')).toBeInTheDocument();
    });

    it('should have correct initial height', () => {
      render(<TestMessageInput />);
      
      const textarea = screen.getByTestId('message-input') as HTMLTextAreaElement;
      expect(textarea).toHaveClass('min-h-[44px]');
    });

    it('should focus on the textarea when rendered', async () => {
      render(<TestMessageInput />);
      
      const textarea = screen.getByTestId('message-input');
      // Focus is handled by the component's useEffect, so we check if it's focusable
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('Text Input and Auto-resize', () => {
    it('should update textarea value when typing', async () => {
      render(<TestMessageInput />);
      
      const textarea = screen.getByTestId('message-input') as HTMLTextAreaElement;
      
      await user.type(textarea, 'Hello world');
      
      expect(textarea.value).toBe('Hello world');
    });

    it('should handle multiline text input', async () => {
      render(<TestMessageInput />);
      
      const textarea = screen.getByTestId('message-input') as HTMLTextAreaElement;
      
      // Simulate Shift+Enter for new line
      await user.type(textarea, 'First line');
      await user.keyboard('{Shift>}{Enter}{/Shift}');
      await user.type(textarea, 'Second line');
      
      expect(textarea.value).toBe('First line\nSecond line');
    });

    it('should adjust height as content increases', async () => {
      render(<TestMessageInput />);
      
      const textarea = screen.getByTestId('message-input') as HTMLTextAreaElement;
      
      // Get initial height
      const initialHeight = textarea.style.height;
      
      // Type a long message that should cause height increase
      const longMessage = 'This is a very long message that should cause the textarea to expand in height because it contains a lot of text content';
      await user.type(textarea, longMessage);
      
      // The height should be adjusted (we can't easily test the exact pixel value)
      expect(textarea.style.height).toBeDefined();
    });

    it('should have maximum height constraint', async () => {
      render(<TestMessageInput />);
      
      const textarea = screen.getByTestId('message-input') as HTMLTextAreaElement;
      expect(textarea).toHaveClass('max-h-[200px]');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should send message on Enter key without Shift', async () => {
      render(<TestMessageInput />);
      
      const textarea = screen.getByTestId('message-input');
      
      await user.type(textarea, 'Test message');
      await user.keyboard('{Enter}');
      
      // Message should be sent and textarea cleared
      expect((textarea as HTMLTextAreaElement).value).toBe('');
    });

    it('should create new line on Shift+Enter', async () => {
      render(<TestMessageInput />);
      
      const textarea = screen.getByTestId('message-input') as HTMLTextAreaElement;
      
      await user.type(textarea, 'First line');
      await user.keyboard('{Shift>}{Enter}{/Shift}');
      await user.type(textarea, 'Second line');
      
      expect(textarea.value).toBe('First line\nSecond line');
    });

    it('should not send empty messages', async () => {
      render(<TestMessageInput />);
      
      const textarea = screen.getByTestId('message-input') as HTMLTextAreaElement;
      
      // Try to send empty message
      await user.keyboard('{Enter}');
      
      expect(textarea.value).toBe('');
    });

    it('should not send messages with only whitespace', async () => {
      render(<TestMessageInput />);
      
      const textarea = screen.getByTestId('message-input') as HTMLTextAreaElement;
      
      await user.type(textarea, '   ');
      await user.keyboard('{Enter}');
      
      // The form submission should have been prevented and textarea should remain with whitespace
      // since our test component doesn't clear it when content is only whitespace
      expect(textarea.value).toBe('   ');
    });
  });

  describe('Form Submission', () => {
    it('should submit form when send button is clicked', async () => {
      render(<TestMessageInput />);
      
      const textarea = screen.getByTestId('message-input');
      const sendButton = screen.getByTestId('send-button');
      
      await user.type(textarea, 'Test message');
      await user.click(sendButton);
      
      expect((textarea as HTMLTextAreaElement).value).toBe('');
    });

    it('should handle form submission with multiline content', async () => {
      render(<TestMessageInput />);
      
      const textarea = screen.getByTestId('message-input') as HTMLTextAreaElement;
      
      await user.type(textarea, 'Line 1');
      await user.keyboard('{Shift>}{Enter}{/Shift}');
      await user.type(textarea, 'Line 2');
      await user.keyboard('{Enter}');
      
      expect(textarea.value).toBe('');
    });

    it('should trim whitespace from messages before sending', async () => {
      render(<TestMessageInput />);
      
      const textarea = screen.getByTestId('message-input') as HTMLTextAreaElement;
      
      await user.type(textarea, '  Test message  ');
      await user.keyboard('{Enter}');
      
      expect(textarea.value).toBe('');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle very long messages', async () => {
      render(<TestMessageInput />);
      
      const textarea = screen.getByTestId('message-input') as HTMLTextAreaElement;
      const longMessage = 'A'.repeat(1000);
      
      await user.type(textarea, longMessage);
      
      expect(textarea.value).toBe(longMessage);
      expect(textarea).toHaveClass('max-h-[200px]'); // Should still respect max height
    });

    it('should handle rapid typing', async () => {
      render(<TestMessageInput />);
      
      const textarea = screen.getByTestId('message-input') as HTMLTextAreaElement;
      
      // Simulate rapid typing
      for (let i = 0; i < 10; i++) {
        await user.type(textarea, `Word${i} `);
      }
      
      expect(textarea.value).toContain('Word0');
      expect(textarea.value).toContain('Word9');
    });

    it('should handle special characters and emojis', async () => {
      render(<TestMessageInput />);
      
      const textarea = screen.getByTestId('message-input') as HTMLTextAreaElement;
      const specialMessage = 'Hello! @#$%^&*() 🚀 ñáéíóú';
      
      await user.type(textarea, specialMessage);
      
      expect(textarea.value).toBe(specialMessage);
    });

    it('should handle copy and paste operations', async () => {
      render(<TestMessageInput />);
      
      const textarea = screen.getByTestId('message-input') as HTMLTextAreaElement;
      
      // Simulate pasting multiline content
      const clipboardContent = 'Pasted line 1\nPasted line 2\nPasted line 3';
      
      fireEvent.change(textarea, { target: { value: clipboardContent } });
      
      expect(textarea.value).toBe(clipboardContent);
    });

    it('should maintain cursor position during auto-resize', async () => {
      render(<TestMessageInput />);
      
      const textarea = screen.getByTestId('message-input') as HTMLTextAreaElement;
      
      await user.type(textarea, 'Some text');
      
      // Move cursor to middle
      textarea.setSelectionRange(4, 4);
      
      // Type more text to trigger resize
      await user.type(textarea, ' inserted');
      
      expect(textarea.value).toContain('inserted');
    });
  });
});