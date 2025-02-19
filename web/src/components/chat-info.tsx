import { useChatStore } from 'src/stores/chat.store';
import { Avatar } from './avatar';

export const ChatInfo = () => {
  const activeChat = useChatStore((state) => state.activeChat);
  const partner = activeChat
    ? useChatStore.getState().getChatPartner(activeChat)
    : null;

  if (!activeChat || !partner) return null;

  return (
    <div className="p-6">
      <div className="flex flex-col items-center">
        <Avatar username={partner.username} size={96} src={partner.avatarUrl} />
        <h2 className="mt-4 text-font font-medium text-xl">
          {partner.username}
        </h2>
        <span className="text-sm text-font-subtle">last seen recently</span>
        <p className="mt-2 text-sm text-font-subtle">
          {partner.bio || 'No bio yet'}
        </p>
      </div>
    </div>
  );
};
