import { useRef, useEffect } from 'react';
import cx from 'classix';
import {
  HiOutlineUserCircle,
  HiOutlineCog,
  HiOutlineMoon,
  HiOutlineLogout,
} from 'react-icons/hi';
import { useAuthStore } from 'src/stores/auth.store';
import { Avatar } from './avatar';
import { useThemeStore } from 'src/stores/theme.store';
import { HiOutlineXMark } from 'react-icons/hi2';

export const SettingsPanel = ({
  isOpen,
  onClose,
  openSection,
}: SettingsPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((state) => state.user);
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const MenuItem = ({
    onClick,
    className,
    children,
  }: {
    onClick?: () => void;
    className?: string;
    children: React.ReactNode;
  }) => {
    return (
      <button
        onClick={onClick}
        className={cx(
          'w-full flex items-center px-6 py-3 text-left gap-4 hover:bg-elevation-hover',
          className
        )}
      >
        {children}
      </button>
    );
  };

  return (
    <>
      <div
        className={cx(
          'fixed inset-0 z-50 transition-opacity duration-200',
          isOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Backdrop */}
        <div
          className={cx(
            'absolute inset-0 bg-black/30 transition-opacity duration-200',
            isOpen ? 'opacity-100' : 'opacity-0'
          )}
        />

        {/* Panel */}
        <div
          ref={panelRef}
          className={cx(
            'absolute left-0 top-0 h-full bg-background-primary',
            'transform transition-all duration-300 ease-out shadow-xl',
            'w-full sm:w-[360px]',
            isOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar
                  username={user?.username || ''}
                  size={48}
                  src={user?.avatarUrl || ''}
                />
                <div>
                  <h2 className="font-medium text-font">{user?.username}</h2>
                  <span className="text-sm text-font-subtle">Online</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-elevation-hover transition-colors"
              >
                <HiOutlineXMark className="w-5 h-5 text-icon-subtle" />
              </button>
            </div>
          </div>

          {/* Settings Menu */}
          <div className="py-2">
            <MenuItem
              onClick={() => {
                onClose();
                openSection('profile');
              }}
            >
              <HiOutlineUserCircle className="size-5 text-icon-subtle" />
              <span className="text-font">My Profile</span>
            </MenuItem>
            <MenuItem
              onClick={() => {
                onClose();
                openSection('settings');
              }}
            >
              <HiOutlineCog className="size-5 text-icon-subtle" />
              <span className="text-font">Settings</span>
            </MenuItem>
            <MenuItem onClick={toggleTheme} className="justify-between">
              <div className="flex gap-4 items-center">
                <HiOutlineMoon className="size-5 text-icon-subtle" />
                <span className="text-font">Night Mode</span>
              </div>
              <div
                className={cx(
                  'w-12 h-6 rounded-full relative transition-colors duration-200',
                  theme === 'dark' ? 'bg-primary' : 'bg-gray-300'
                )}
              >
                <div
                  className={cx(
                    'absolute w-5 h-5 rounded-full bg-white top-0.5 transition-transform duration-200',
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
                  )}
                />
              </div>
            </MenuItem>
            <MenuItem onClick={() => useAuthStore.getState().logout()}>
              <HiOutlineLogout className="size-5 text-icon-error" />
              <span className="text-font-error">Log Out</span>
            </MenuItem>
          </div>
        </div>
      </div>
    </>
  );
};

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  openSection: (section: 'profile' | 'settings') => void;
}
