# Font Size System

The font size system provides three preset sizes that maintain a proper emoji-to-text ratio.

## Usage

```typescript
import { setFontSize } from '../stores/font-size.store';

// Set font size programmatically
setFontSize('small');  // 14px text, 18px emoji
setFontSize('medium'); // 16px text, 22px emoji (default)
setFontSize('large');  // 18px text, 24px emoji
```

## How it works

- The font size settings are stored in localStorage
- CSS variables `--font-size-base` and `--font-size-emoji` are automatically updated
- Message input uses base font size
- Message content (including emojis) uses emoji font size
- The ratio between text and emoji sizes is maintained across all sizes

## Font Size Configuration

| Size   | Text Size | Emoji Size | Ratio |
|--------|-----------|------------|-------|
| small  | 14px      | 18px       | 1.28x |
| medium | 16px      | 22px       | 1.375x|
| large  | 18px      | 24px       | 1.33x |

## Future UI Integration

When implementing the UI controls, use the `useFontSizeStore` hook:

```typescript
import { useFontSizeStore } from '../stores/font-size.store';

const FontSizeSelector = () => {
  const { fontSize, setFontSize } = useFontSizeStore();
  
  return (
    <div>
      <button 
        onClick={() => setFontSize('small')}
        className={fontSize === 'small' ? 'active' : ''}
      >
        Small
      </button>
      <button 
        onClick={() => setFontSize('medium')}
        className={fontSize === 'medium' ? 'active' : ''}
      >
        Medium
      </button>
      <button 
        onClick={() => setFontSize('large')}
        className={fontSize === 'large' ? 'active' : ''}
      >
        Large
      </button>
    </div>
  );
};
```