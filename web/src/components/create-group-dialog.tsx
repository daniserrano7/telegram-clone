import { useState, useRef, useEffect } from 'react';
import { HiOutlineXMark, HiOutlineUserGroup, HiOutlinePlus, HiOutlineCheck } from 'react-icons/hi2';
import cx from 'classix';
import { apiService } from 'src/services/api.service';
import { useChatStore } from 'src/stores/chat.store';
import { useAuthStore } from 'src/stores/auth.store';
import { Avatar } from './avatar';

type SearchUser = {
  id: number;
  username: string;
  avatarUrl: string | null;
};

interface CreateGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated?: (chatId: number) => void;
}

export const CreateGroupDialog = ({
  isOpen,
  onClose,
  onGroupCreated,
}: CreateGroupDialogProps) => {
  const [step, setStep] = useState<'members' | 'details'>('members');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [search, setSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundUsers, setFoundUsers] = useState<SearchUser[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<SearchUser[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const createGroup = useChatStore((state) => state.createGroup);
  const currentUser = useAuthStore((state) => state.user);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('members');
      setGroupName('');
      setGroupDescription('');
      setSearch('');
      setFoundUsers([]);
      setSelectedMembers([]);
      setError('');
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Focus name input when moving to details step
  useEffect(() => {
    if (step === 'details') {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [step]);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);

    if (!value.trim()) {
      setFoundUsers([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await apiService.searchUsers(value);
      if (res.status === 'success') {
        // Filter out current user and already selected members
        const filtered = res.data.filter(
          (u) =>
            u.id !== currentUser?.id &&
            !selectedMembers.some((m) => m.id === u.id)
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

  const handleSelectMember = (user: SearchUser) => {
    setSelectedMembers((prev) => [...prev, user]);
    setFoundUsers((prev) => prev.filter((u) => u.id !== user.id));
    setSearch('');
  };

  const handleRemoveMember = (userId: number) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== userId));
  };

  const handleNext = () => {
    if (selectedMembers.length < 1) {
      setError('Please select at least one member');
      return;
    }
    setError('');
    setStep('details');
  };

  const handleBack = () => {
    setStep('members');
    setError('');
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const result = await createGroup({
        name: groupName.trim(),
        description: groupDescription.trim() || undefined,
        userIds: selectedMembers.map((m) => m.id),
      });

      if (result.chatId) {
        onGroupCreated?.(result.chatId);
        onClose();
      } else {
        setError('Failed to create group');
      }
    } catch (err) {
      console.error('Failed to create group', err);
      setError('Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md mx-4 bg-background-primary rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <HiOutlineUserGroup className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-semibold text-font">
              {step === 'members' ? 'Add Members' : 'Group Details'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-elevation-hover rounded-full transition-colors"
          >
            <HiOutlineXMark className="w-5 h-5 text-icon-subtle" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {step === 'members' ? (
            <>
              {/* Search input */}
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={handleSearch}
                className="w-full bg-input-background hover:bg-input-background-hover text-font py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-3"
              />

              {/* Selected members */}
              {selectedMembers.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm text-font-subtle mb-2">
                    Selected ({selectedMembers.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 bg-elevation px-2 py-1 rounded-full"
                      >
                        <Avatar
                          username={member.username}
                          src={member.avatarUrl}
                          size={24}
                        />
                        <span className="text-sm text-font">{member.username}</span>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-0.5 hover:bg-elevation-hover rounded-full"
                        >
                          <HiOutlineXMark className="w-4 h-4 text-icon-subtle" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search results */}
              <div className="max-h-60 overflow-y-auto">
                {isSearching ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : foundUsers.length > 0 ? (
                  foundUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectMember(user)}
                      className="w-full flex items-center gap-3 p-2 hover:bg-elevation-hover rounded-lg transition-colors"
                    >
                      <Avatar
                        username={user.username}
                        src={user.avatarUrl}
                        size={40}
                      />
                      <span className="text-font">{user.username}</span>
                      <HiOutlinePlus className="w-5 h-5 text-primary ml-auto" />
                    </button>
                  ))
                ) : search ? (
                  <p className="text-center py-4 text-font-subtle">No users found</p>
                ) : null}
              </div>
            </>
          ) : (
            <>
              {/* Group name */}
              <div className="mb-4">
                <label className="block text-sm text-font-subtle mb-1">
                  Group Name *
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  placeholder="Enter group name..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-input-background hover:bg-input-background-hover text-font py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={50}
                />
              </div>

              {/* Group description */}
              <div className="mb-4">
                <label className="block text-sm text-font-subtle mb-1">
                  Description (optional)
                </label>
                <textarea
                  placeholder="Enter group description..."
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="w-full bg-input-background hover:bg-input-background-hover text-font py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={3}
                  maxLength={200}
                />
              </div>

              {/* Members preview */}
              <div className="mb-4">
                <p className="text-sm text-font-subtle mb-2">
                  Members ({selectedMembers.length + 1})
                </p>
                <div className="flex -space-x-2">
                  {/* Current user */}
                  {currentUser && (
                    <div className="relative z-10" title="You">
                      <Avatar
                        username={currentUser.username}
                        src={currentUser.avatarUrl}
                        size={32}
                      />
                      <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-0.5">
                        <HiOutlineCheck className="w-2 h-2 text-white" />
                      </div>
                    </div>
                  )}
                  {selectedMembers.slice(0, 5).map((member) => (
                    <div key={member.id} title={member.username}>
                      <Avatar
                        username={member.username}
                        src={member.avatarUrl}
                        size={32}
                      />
                    </div>
                  ))}
                  {selectedMembers.length > 5 && (
                    <div className="w-8 h-8 rounded-full bg-elevation flex items-center justify-center text-xs text-font-subtle">
                      +{selectedMembers.length - 5}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Error message */}
          {error && (
            <p className="text-red-500 text-sm mb-3">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between p-4 border-t border-border">
          {step === 'members' ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-font-subtle hover:bg-elevation-hover rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleNext}
                disabled={selectedMembers.length < 1}
                className={cx(
                  'px-4 py-2 rounded-lg transition-colors',
                  selectedMembers.length >= 1
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-elevation text-font-subtle cursor-not-allowed'
                )}
              >
                Next
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleBack}
                className="px-4 py-2 text-font-subtle hover:bg-elevation-hover rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreate}
                disabled={isCreating || !groupName.trim()}
                className={cx(
                  'px-4 py-2 rounded-lg transition-colors flex items-center gap-2',
                  !isCreating && groupName.trim()
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-elevation text-font-subtle cursor-not-allowed'
                )}
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Creating...
                  </>
                ) : (
                  'Create Group'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
