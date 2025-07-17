import { useState, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import cx from 'classix';
import {
  HiOutlineXMark,
  HiOutlinePencil,
  HiOutlineCamera,
} from 'react-icons/hi2';
import { useAuthStore } from 'src/stores/auth.store';
import { Avatar } from './avatar';
import { apiService } from 'src/services/api.service';
import { type User } from '@shared/user.dto';
import 'src/styles/animations.css';

export const ProfileDialog = ({
  isOpen,
  onClose,
  viewUser,
}: ProfileDialogProps) => {
  const currentUser = useAuthStore((state) => state.user);
  const user = viewUser || currentUser;
  const isOwnProfile = !viewUser;
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveBio = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const result = await apiService.updateUserBio(user.id, bio);
      if (result.status === 'success') {
        useAuthStore.setState({ user: { ...user, bio: bio } });
        setIsEditingBio(false);
      }
    } catch (error) {
      console.error('Failed to update bio:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    if (!isOwnProfile) return;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      console.error('Invalid file type. Please select an image.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      console.error('File is too large. Maximum size is 5MB.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const result = await apiService.updateUserAvatar(user.id, file);
      if (result.status === 'success') {
        const updatedUser = { ...user, avatarUrl: result.data.avatarUrl };

        // Update the local state for immediate UI update
        setAvatarUrl(result.data.avatarUrl);

        // Update the auth store
        useAuthStore.setState({ user: updatedUser });

        // Update localStorage to persist the change
        const token = useAuthStore.getState().token;
        localStorage.setItem(
          'user',
          JSON.stringify({ user: updatedUser, token })
        );

        // Force a re-render of the avatar by adding a timestamp to the URL
        const timestamp = new Date().getTime();
        setAvatarUrl(`${result.data.avatarUrl}?t=${timestamp}`);
      }
    } catch (error) {
      console.error('Failed to upload avatar:', error);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open: boolean) => !open && onClose()}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 dialog-overlay" />
        <Dialog.Content
          className={cx(
            'fixed left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2',
            'w-[95%] sm:w-[400px] max-w-[400px]',
            'bg-background-primary rounded-lg shadow-xl p-8',
            'focus:outline-none dialog-content'
          )}
        >
          <Dialog.Close asChild>
            <button className="absolute right-4 top-4 p-2 rounded-full hover:bg-elevation-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <HiOutlineXMark className="w-5 h-5 text-icon-subtle" />
            </button>
          </Dialog.Close>

          <div className="flex flex-col items-center">
            <div className="relative">
              <Avatar
                username={user.username}
                size={96}
                src={avatarUrl || user.avatarUrl}
                key={avatarUrl} // Add key to force re-render when avatarUrl changes
              />
              {isOwnProfile && (
                <button
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  className={cx(
                    'absolute bottom-0 right-0 p-2 rounded-full bg-primary text-white',
                    'hover:bg-primary/90 transition-colors',
                    isUploadingAvatar && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <HiOutlineCamera className="w-5 h-5" />
                </button>
              )}
              {isOwnProfile && (
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  key={isUploadingAvatar ? 'uploading' : 'idle'}
                />
              )}
            </div>
            <Dialog.Title className="mt-4 text-xl font-medium text-font">
              {user.username}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-font-subtle">
              Online
            </Dialog.Description>
          </div>

          <div className="mt-8 space-y-4">
            <div className="space-y-1">
              <label className="text-sm text-font-subtle">Username</label>
              <p className="text-font">@{user.username}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm text-font-subtle">Bio</label>
                {isOwnProfile && !isEditingBio && (
                  <button
                    onClick={() => setIsEditingBio(true)}
                    className="p-2 hover:bg-elevation-hover rounded-full transition-colors"
                  >
                    <HiOutlinePencil className="w-4 h-4 text-icon-subtle" />
                  </button>
                )}
              </div>
              {isOwnProfile && isEditingBio ? (
                <div className="space-y-2">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Write something about yourself..."
                    className="w-full p-2 bg-elevation-sunken rounded-lg text-font resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                    maxLength={160}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-font-subtle">
                      {bio.length}/160
                    </span>
                    <div className="space-x-2">
                      <button
                        onClick={() => {
                          setIsEditingBio(false);
                          setBio(user.bio || '');
                        }}
                        className="px-3 py-1 text-sm text-font-subtle hover:bg-elevation-hover rounded-lg transition-colors"
                        disabled={isSaving}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveBio}
                        disabled={isSaving || bio === user.bio}
                        className={cx(
                          'px-3 py-1 text-sm text-white rounded-lg transition-colors',
                          isSaving || bio === user.bio
                            ? 'bg-primary-light cursor-not-allowed'
                            : 'bg-primary hover:bg-primary-dark'
                        )}
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-font">
                  {user.bio ||
                    (isOwnProfile
                      ? 'No bio yet. Click the pen to add one!'
                      : 'No bio yet.')}
                </p>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

interface ProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  viewUser?: User;
}
