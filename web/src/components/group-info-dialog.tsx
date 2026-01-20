import { useState, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  HiOutlineXMark,
  HiOutlinePencil,
  HiOutlineUserPlus,
  HiOutlineArrowRightOnRectangle,
  HiOutlineTrash,
  HiOutlineShieldCheck,
  HiOutlineUser,
  HiOutlineCamera,
} from 'react-icons/hi2';
import cx from 'classix';
import { useChatStore } from 'src/stores/chat.store';
import { useAuthStore } from 'src/stores/auth.store';
import { apiService } from 'src/services/api.service';
import { Avatar } from './avatar';
import { ChatMemberRole } from '@shared/gateway.dto';
import 'src/styles/animations.css';

interface GroupInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GroupInfoDialog = ({ isOpen, onClose }: GroupInfoDialogProps) => {
  const activeChat = useChatStore((state) => state.activeChat);
  const isUserAdmin = useChatStore((state) => state.isUserAdmin);
  const fetchChat = useChatStore((state) => state.fetchChat);
  const setActiveChat = useChatStore((state) => state.setActiveChat);
  const currentUser = useAuthStore((state) => state.user);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundUsers, setFoundUsers] = useState<{ id: number; username: string; avatarUrl: string | null }[]>([]);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<number | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !activeChat || activeChat.type !== 'GROUP') return null;

  const isAdmin = currentUser ? isUserAdmin(activeChat, currentUser.id) : false;
  const chatId = activeChat.id;

  const handleStartEdit = () => {
    setEditName(activeChat.name || '');
    setEditDescription(activeChat.description || '');
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!chatId || !editName.trim()) return;

    setIsSaving(true);
    try {
      const result = await apiService.updateGroup(chatId, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });

      if (result.status === 'success') {
        fetchChat(chatId);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Failed to update group', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!chatId || !confirm('Are you sure you want to leave this group?')) return;

    setIsLeaving(true);
    try {
      const result = await apiService.leaveGroup(chatId);
      if (result.status === 'success') {
        // Remove chat from list and close
        setActiveChat(null);
        onClose();
      }
    } catch (err) {
      console.error('Failed to leave group', err);
    } finally {
      setIsLeaving(false);
    }
  };

  const handleSearchUsers = async (value: string) => {
    setSearch(value);
    if (!value.trim()) {
      setFoundUsers([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await apiService.searchUsers(value);
      if (res.status === 'success') {
        // Filter out current members
        const filtered = res.data.filter(
          (u) => !activeChat.members.some((m) => m.id === u.id)
        );
        setFoundUsers(
          filtered.map((u) => ({
            id: u.id,
            username: u.username,
            avatarUrl: u.avatarUrl || null,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to search users', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMember = async (userId: number) => {
    if (!chatId) return;

    setIsAddingMembers(true);
    try {
      const result = await apiService.addGroupMembers(chatId, [userId]);
      if (result.status === 'success') {
        fetchChat(chatId);
        setFoundUsers((prev) => prev.filter((u) => u.id !== userId));
        setSearch('');
      }
    } catch (err) {
      console.error('Failed to add member', err);
    } finally {
      setIsAddingMembers(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!chatId || !confirm('Are you sure you want to remove this member?')) return;

    setMemberToRemove(userId);
    try {
      const result = await apiService.removeGroupMember(chatId, userId);
      if (result.status === 'success') {
        fetchChat(chatId);
      }
    } catch (err) {
      console.error('Failed to remove member', err);
    } finally {
      setMemberToRemove(null);
    }
  };

  const handleUpdateRole = async (userId: number, role: ChatMemberRole) => {
    if (!chatId) return;

    try {
      const result = await apiService.updateMemberRole(chatId, userId, role);
      if (result.status === 'success') {
        fetchChat(chatId);
      }
    } catch (err) {
      console.error('Failed to update role', err);
    }
  };

  const handleAvatarClick = () => {
    if (!isAdmin) return;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !chatId) return;

    if (!file.type.startsWith('image/')) {
      console.error('Invalid file type. Please select an image.');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.error('File is too large. Maximum size is 5MB.');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const result = await apiService.updateGroupAvatar(chatId, file);
      if (result.status === 'success') {
        // Refetch the chat to get updated avatar
        fetchChat(chatId);

        // Force re-render with timestamp
        const timestamp = new Date().getTime();
        setAvatarUrl(`${result.data.avatarUrl}?t=${timestamp}`);
      }
    } catch (error) {
      console.error('Failed to upload group avatar:', error);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const getMemberRole = (userId: number): ChatMemberRole => {
    const membership = activeChat.memberships?.find((m) => m.userId === userId);
    return membership?.role || 'MEMBER';
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(open: boolean) => !open && onClose()}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 dialog-overlay z-50" />
        <Dialog.Content
          className={cx(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            'w-[95%] sm:w-[450px] max-w-[450px] max-h-[90vh]',
            'bg-background-primary rounded-lg shadow-xl',
            'focus:outline-none dialog-content flex flex-col overflow-hidden'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
            <Dialog.Title className="text-lg font-semibold text-font">
              Group Info
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 hover:bg-elevation-hover rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <HiOutlineXMark className="w-5 h-5 text-icon-subtle" />
              </button>
            </Dialog.Close>
          </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Group avatar and name */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <Avatar
                username={activeChat.name || 'Group'}
                src={avatarUrl || activeChat.avatarUrl}
                size={80}
                key={avatarUrl}
              />
              {isAdmin && (
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
              {isAdmin && (
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

            {isEditing ? (
              <div className="mt-4 w-full space-y-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Group name"
                  className="w-full bg-input-background text-font py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full bg-input-background text-font py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 py-2 text-font-subtle hover:bg-elevation-hover rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSaving || !editName.trim()}
                    className={cx(
                      'flex-1 py-2 rounded-lg transition-colors',
                      !isSaving && editName.trim()
                        ? 'bg-primary text-white hover:bg-primary/90'
                        : 'bg-elevation text-font-subtle cursor-not-allowed'
                    )}
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h3 className="mt-3 text-xl font-semibold text-font">
                  {activeChat.name || 'Unnamed Group'}
                </h3>
                {activeChat.description && (
                  <p className="mt-1 text-font-subtle text-center">
                    {activeChat.description}
                  </p>
                )}
                <p className="mt-1 text-sm text-font-subtle">
                  {activeChat.members.length} members
                </p>
                {isAdmin && (
                  <button
                    onClick={handleStartEdit}
                    className="mt-2 flex items-center gap-1 text-primary text-sm hover:underline"
                  >
                    <HiOutlinePencil className="w-4 h-4" />
                    Edit
                  </button>
                )}
              </>
            )}
          </div>

          {/* Members section */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-font">Members</h4>
              {isAdmin && (
                <button
                  onClick={() => setShowAddMembers(!showAddMembers)}
                  className="flex items-center gap-1 text-primary text-sm hover:underline"
                >
                  <HiOutlineUserPlus className="w-4 h-4" />
                  Add
                </button>
              )}
            </div>

            {/* Add members search */}
            {showAddMembers && isAdmin && (
              <div className="mb-4">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  placeholder="Search users to add..."
                  className="w-full bg-input-background text-font py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-2"
                />
                {isSearching ? (
                  <div className="flex justify-center py-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                  </div>
                ) : foundUsers.length > 0 ? (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {foundUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleAddMember(user.id)}
                        disabled={isAddingMembers}
                        className="w-full flex items-center gap-2 p-2 hover:bg-elevation-hover rounded-lg transition-colors"
                      >
                        <Avatar username={user.username} src={user.avatarUrl} size={32} />
                        <span className="text-font">{user.username}</span>
                        <HiOutlineUserPlus className="w-4 h-4 text-primary ml-auto" />
                      </button>
                    ))}
                  </div>
                ) : search ? (
                  <p className="text-center py-2 text-font-subtle text-sm">No users found</p>
                ) : null}
              </div>
            )}

            {/* Member list */}
            <div className="space-y-2">
              {[...activeChat.members].sort((a, b) => {
                const roleA = getMemberRole(a.id);
                const roleB = getMemberRole(b.id);
                // Admins first
                if (roleA === 'ADMIN' && roleB !== 'ADMIN') return -1;
                if (roleA !== 'ADMIN' && roleB === 'ADMIN') return 1;
                return 0;
              }).map((member) => {
                const role = getMemberRole(member.id);
                const isCurrentUser = member.id === currentUser?.id;
                const canManage = isAdmin && !isCurrentUser;

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-elevation-hover"
                  >
                    <Avatar
                      username={member.username}
                      src={member.avatarUrl}
                      size={40}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-font truncate">{member.username}</span>
                        {isCurrentUser && (
                          <span className="text-xs text-font-subtle">(you)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-font-subtle">
                        {role === 'ADMIN' ? (
                          <>
                            <HiOutlineShieldCheck className="w-3 h-3 text-primary" />
                            Admin
                          </>
                        ) : (
                          <>
                            <HiOutlineUser className="w-3 h-3" />
                            Member
                          </>
                        )}
                      </div>
                    </div>

                    {/* Admin actions */}
                    {canManage && (
                      <div className="flex items-center gap-1">
                        {role === 'MEMBER' ? (
                          <button
                            onClick={() => handleUpdateRole(member.id, 'ADMIN')}
                            className="p-1.5 hover:bg-elevation rounded-full text-icon-subtle hover:text-primary transition-colors"
                            title="Make admin"
                          >
                            <HiOutlineShieldCheck className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateRole(member.id, 'MEMBER')}
                            className="p-1.5 hover:bg-elevation rounded-full text-primary hover:text-icon-subtle transition-colors"
                            title="Remove admin"
                          >
                            <HiOutlineShieldCheck className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={memberToRemove === member.id}
                          className="p-1.5 hover:bg-elevation rounded-full text-icon-subtle hover:text-red-500 transition-colors"
                          title="Remove from group"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

          {/* Footer */}
          <div className="p-4 border-t border-border flex-shrink-0">
            <button
              onClick={handleLeaveGroup}
              disabled={isLeaving}
              className="w-full flex items-center justify-center gap-2 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
              {isLeaving ? 'Leaving...' : 'Leave Group'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
