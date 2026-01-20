import * as Dialog from '@radix-ui/react-dialog';
import { useThemeStore, Accent, FontSize } from 'src/stores/theme.store';
import { HiOutlineXMark } from 'react-icons/hi2';
import cx from 'classix';
import 'src/styles/animations.css';
import { useAuthStore } from 'src/stores/auth.store';
import { NotificationStatus } from './notification-permission-request';

const ACCENT_COLORS: { name: Accent; color: string }[] = [
  { name: 'blue', color: '#2481cc' },
  { name: 'red', color: '#ef4444' },
  { name: 'green', color: '#16a34a' },
  { name: 'yellow', color: '#f59e0b' },
  { name: 'purple', color: '#8b5cf6' },
  { name: 'orange', color: '#f97316' },
] as const;

const FONT_SIZES: { name: FontSize; label: string; preview: string }[] = [
  { name: 'small', label: 'Small', preview: 'Aa' },
  { name: 'medium', label: 'Medium', preview: 'Aa' },
  { name: 'large', label: 'Large', preview: 'Aa' },
  { name: 'extra-large', label: 'Extra Large', preview: 'Aa' },
] as const;

export const ThemeSettingsDialog = ({
  isOpen,
  onClose,
}: ThemeSettingsDialogProps) => {
  const { accent, setAccent, theme, setTheme, fontSize, setFontSize } = useThemeStore();
  const user = useAuthStore((state) => state.user);
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 dialog-overlay" />
        <Dialog.Content
          className={cx(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-[95%] sm:w-[400px] max-w-[400px] max-h-[90vh]',
            'bg-background-primary rounded-lg shadow-xl',
            'focus:outline-none dialog-content overflow-y-auto'
          )}
          aria-describedby={undefined}
        >
          {/* Header */}
          <div className="p-6 border-b border-border flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-elevation-hover transition-colors"
            >
              <HiOutlineXMark className="w-5 h-5 text-icon-subtle" />
            </button>
            <Dialog.Title className="text-lg font-medium text-font">
              Chat Settings
            </Dialog.Title>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Notifications Section */}
            <div className="mb-8">
              <h3 className="text-sm font-medium text-font-subtle mb-4">
                Notifications
              </h3>
              <NotificationStatus />
            </div>

            <h3 className="text-sm font-medium text-font-subtle mb-4">
              Themes
            </h3>
            <div className="grid grid-cols-4 gap-3 mb-8">
              <button onClick={() => setTheme('light')}>
                <div className={cx(
                  "relative hover:bg-elevation-hover transition-colors aspect-square rounded-lg bg-[#8BC34A]/10 cursor-pointer",
                  theme === 'light' ? "border-2 border-primary" : "border border-border"
                )}>
                  <div className="absolute inset-2 rounded bg-white"></div>
                  <div className="absolute bottom-2 left-2 right-2 h-3 rounded bg-[#8BC34A]/20"></div>
                  <div className="absolute top-2 left-2 w-12 h-2 rounded bg-[#8BC34A]/20"></div>
                  {theme === 'light' && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                  )}
                </div>
                <p className="text-sm mt-1 text-font-subtle text-center">
                  Light
                </p>
              </button>
              {/* <div>
                <div className="relative hover:bg-elevation-hover transition-colors aspect-square rounded-lg bg-[#8BC34A]/10 border border-border cursor-pointer">
                  <div className="absolute inset-2 rounded bg-[#8BC34A]/10"></div>
                  <div className="absolute bottom-2 left-2 right-2 h-3 rounded bg-[#8BC34A]/20"></div>
                  <div className="absolute top-2 left-2 w-12 h-2 rounded bg-[#8BC34A]/20"></div>
                </div>
                <p className="text-sm mt-1 text-font-subtle text-center">
                  Light
                </p>
              </div> */}
              {/* <div>
                <div className="relative hover:bg-elevation-hover transition-colors aspect-square rounded-lg bg-[#795548]/20 border border-border cursor-pointer">
                  <div className="absolute inset-2 rounded bg-[#795548]/10"></div>
                  <div className="absolute bottom-2 left-2 right-2 h-3 rounded bg-[#ef4444]/20"></div>
                  <div className="absolute top-2 left-2 w-12 h-2 rounded bg-[#ef4444]/20"></div>
                </div>
                <p className="text-sm mt-1 text-font-subtle text-center">
                  Dark
                </p>
              </div> */}
              <button onClick={() => setTheme('dark')}>
                <div className={cx(
                  "relative hover:bg-elevation-hover transition-colors aspect-square rounded-lg bg-[#263238] cursor-pointer",
                  theme === 'dark' ? "border-2 border-primary" : "border border-border"
                )}>
                  <div className="absolute inset-2 rounded bg-[#37474F]"></div>
                  <div className="absolute bottom-2 left-2 right-2 h-3 rounded bg-[#78909C]/20"></div>
                  <div className="absolute top-2 left-2 w-12 h-2 rounded bg-[#78909C]/20"></div>
                  {theme === 'dark' && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                  )}
                </div>
                <p className="text-sm mt-1 text-font-subtle text-center">
                  Dark
                </p>
              </button>
            </div>

            <h3 className="text-sm font-medium text-font-subtle mb-4">
              Accent Color
            </h3>
            <div className="space-y-6">
              {/* Accent Color */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-font">Your name color</span>
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: ACCENT_COLORS.find((c) => c.name === accent)
                        ?.color,
                    }}
                  >
                    {user?.username}
                  </span>
                </div>
                <div className="flex justify-between">
                  {ACCENT_COLORS.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setAccent(color.name)}
                      className={cx(
                        'w-10 h-10 aspect-square rounded-full relative',
                        'transition-transform hover:scale-110 focus:scale-110',
                        // 'focus:outline-none focus:ring-2 focus:ring-offset-2',
                        'focus:ring-offset-background-primary focus:ring-primary/50'
                      )}
                      style={{ backgroundColor: color.color }}
                    >
                      {accent === color.name && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-7 h-7 grid place-items-center rounded-full bg-white">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: color.color }}
                            />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Font Size */}
              <div className="mt-8">
                <h3 className="text-sm font-medium text-font-subtle mb-4">
                  Message Text Size
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {FONT_SIZES.map((size) => (
                    <button
                      key={size.name}
                      onClick={() => setFontSize(size.name)}
                      className={cx(
                        'flex flex-col items-center justify-center p-4 rounded-lg',
                        'border-2 transition-all hover:bg-elevation-hover',
                        fontSize === size.name
                          ? 'border-primary bg-elevation'
                          : 'border-border'
                      )}
                    >
                      <span
                        className="font-medium text-font mb-1"
                        style={{
                          fontSize:
                            size.name === 'small'
                              ? '12px'
                              : size.name === 'medium'
                              ? '16px'
                              : size.name === 'large'
                              ? '20px'
                              : '28px',
                        }}
                      >
                        {size.preview}
                      </span>
                      <span className="text-xs text-font-subtle">
                        {size.label}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-font-subtle mt-3">
                  Changes the size of message text in chats
                </p>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

interface ThemeSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}
