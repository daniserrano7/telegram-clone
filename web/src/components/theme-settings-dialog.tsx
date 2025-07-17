import * as Dialog from '@radix-ui/react-dialog';
import { useThemeStore, Accent } from 'src/stores/theme.store';
import { HiOutlineXMark } from 'react-icons/hi2';
import cx from 'classix';
import 'src/styles/animations.css';

const ACCENT_COLORS: { name: Accent; color: string }[] = [
  { name: 'blue', color: '#2481cc' },
  { name: 'red', color: '#ef4444' },
  { name: 'green', color: '#16a34a' },
  { name: 'yellow', color: '#f59e0b' },
  { name: 'purple', color: '#8b5cf6' },
  { name: 'orange', color: '#f97316' },
] as const;

export const ThemeSettingsDialog = ({
  isOpen,
  onClose,
}: ThemeSettingsDialogProps) => {
  const { accent, setAccent } = useThemeStore();

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 dialog-overlay" />
        <Dialog.Content
          className={cx(
            'fixed left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2',
            'w-[95%] sm:w-[400px] max-w-[400px]',
            'bg-background-primary rounded-lg shadow-xl',
            'focus:outline-none dialog-content'
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
            <h3 className="text-sm font-medium text-font-subtle mb-4">
              Themes
            </h3>
            <div className="grid grid-cols-4 gap-3 mb-8">
              <div>
                <div className="relative hover:bg-elevation-hover transition-colors aspect-square rounded-lg bg-[#8BC34A]/10 border border-border cursor-pointer">
                  <div className="absolute inset-2 rounded bg-white"></div>
                  <div className="absolute bottom-2 left-2 right-2 h-3 rounded bg-[#8BC34A]/20"></div>
                  <div className="absolute top-2 left-2 w-12 h-2 rounded bg-[#8BC34A]/20"></div>
                </div>
                <p className="text-sm mt-1 text-font-subtle text-center">
                  Light
                </p>
              </div>
              <div>
                <div className="relative hover:bg-elevation-hover transition-colors aspect-square rounded-lg bg-[#8BC34A]/10 border border-border cursor-pointer">
                  <div className="absolute inset-2 rounded bg-[#8BC34A]/10"></div>
                  <div className="absolute bottom-2 left-2 right-2 h-3 rounded bg-[#8BC34A]/20"></div>
                  <div className="absolute top-2 left-2 w-12 h-2 rounded bg-[#8BC34A]/20"></div>
                </div>
                <p className="text-sm mt-1 text-font-subtle text-center">
                  Light
                </p>
              </div>
              <div>
                <div className="relative hover:bg-elevation-hover transition-colors aspect-square rounded-lg bg-[#795548]/20 border border-border cursor-pointer">
                  <div className="absolute inset-2 rounded bg-[#795548]/10"></div>
                  <div className="absolute bottom-2 left-2 right-2 h-3 rounded bg-[#ef4444]/20"></div>
                  <div className="absolute top-2 left-2 w-12 h-2 rounded bg-[#ef4444]/20"></div>
                </div>
                <p className="text-sm mt-1 text-font-subtle text-center">
                  Dark
                </p>
              </div>
              <div>
                <div className="relative hover:bg-elevation-hover transition-colors aspect-square rounded-lg bg-[#263238] border border-border cursor-pointer">
                  <div className="absolute inset-2 rounded bg-[#37474F]"></div>
                  <div className="absolute bottom-2 left-2 right-2 h-3 rounded bg-[#78909C]/20"></div>
                  <div className="absolute top-2 left-2 w-12 h-2 rounded bg-[#78909C]/20"></div>
                </div>
                <p className="text-sm mt-1 text-font-subtle text-center">
                  Dark
                </p>
              </div>
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
                    Daniel
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
                  {/* <button
                    className={cx(
                      'w-full aspect-square rounded-full relative bg-elevation-hover',
                      'transition-transform hover:scale-110 focus:scale-110',
                      'focus:outline-none focus:ring-2 focus:ring-offset-2',
                      'focus:ring-offset-background-primary focus:ring-primary/50',
                      'flex items-center justify-center text-lg'
                    )}
                  >
                    ✨
                  </button> */}
                </div>
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
