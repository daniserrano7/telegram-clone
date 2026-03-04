import { useState } from 'react';
import { useChatStore } from 'src/stores/chat.store';
import { useAuthStore } from 'src/stores/auth.store';
import { useContactsStore } from 'src/stores/contacts.store';
import { Avatar } from './avatar';
import { GroupInfoDialog } from './group-info-dialog';
import { HiOutlineShieldCheck, HiOutlineUser } from 'react-icons/hi2';
import { formatLastActive } from 'src/utils/date';

export const ChatInfo = () => {
  const activeChat = useChatStore((state) => state.activeChat);
  const getChatPartner = useChatStore((state) => state.getChatPartner);
  const getChatName = useChatStore((state) => state.getChatName);
  const getChatAvatar = useChatStore((state) => state.getChatAvatar);
  const currentUser = useAuthStore((state) => state.user);
  const contacts = useContactsStore((state) => state.contacts);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  if (!activeChat) return null;

  const isGroup = activeChat.type === 'GROUP';

  // For direct chats
  if (!isGroup) {
    const partner = getChatPartner(activeChat);
    if (!partner) return null;

    const contact = contacts[partner.id];
    const isOnline = contact?.onlineStatus === 'ONLINE';
    const lastConnection = contact?.lastConnection;

    return (
      <div className="p-6">
        <div className="flex flex-col items-center">
          <Avatar username={partner.username} size={96} src={partner.avatarUrl} />
          <h2 className="mt-4 text-font font-medium text-xl">
            {partner.username}
          </h2>
          <span className="text-sm text-font-subtle">
            {isOnline ? 'Online' : lastConnection ? `Last seen ${formatLastActive(lastConnection)}` : 'Offline'}
          </span>
          <p className="mt-2 text-sm text-font-subtle text-center">
            {partner.bio || 'No bio yet'}
          </p>
        </div>
      </div>
    );
  }

  // For group chats
  const chatName = getChatName(activeChat);
  const chatAvatar = getChatAvatar(activeChat);

  const getMemberRole = (userId: number) => {
    const membership = activeChat.memberships?.find((m) => m.userId === userId);
    return membership?.role || 'MEMBER';
  };

  return (
    <>
      <GroupInfoDialog
        isOpen={showGroupInfo}
        onClose={() => setShowGroupInfo(false)}
      />
      <div className="p-6">
        <div className="flex flex-col items-center">
          <button onClick={() => setShowGroupInfo(true)} className="hover:opacity-80 transition-opacity">
            <Avatar
              username={chatAvatar.username || chatName}
              size={96}
              src={chatAvatar.src ?? null}
            />
          </button>
          <button
            onClick={() => setShowGroupInfo(true)}
            className="hover:underline"
          >
            <h2 className="mt-4 text-font font-medium text-xl">{chatName}</h2>
          </button>
          <span className="text-sm text-font-subtle">
            {activeChat.members.length} members
          </span>
          {activeChat.description && (
            <p className="mt-2 text-sm text-font-subtle text-center">
              {activeChat.description}
            </p>
          )}

          {/* Member list preview */}
          <div className="mt-6 w-full">
            <h3 className="text-sm font-medium text-font mb-3">Members</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
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

                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2 rounded-lg"
                  >
                    <Avatar
                      username={member.username}
                      src={member.avatarUrl}
                      size={36}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-font text-sm truncate">
                          {member.username}
                        </span>
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
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setShowGroupInfo(true)}
            className="mt-4 text-primary text-sm hover:underline"
          >
            View full info
          </button>
        </div>
      </div>
    </>
  );
};
