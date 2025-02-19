import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { useChatStore } from '../stores/chat.store';
import { useUserStore } from 'src/stores/user.store';
import { Sidebar } from 'src/components/sidebar';

export const ChatsPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  if (!user) {
    console.error('User not logged in');
    navigate('/login');
  }

  return (
    <main className="w-full h-screen flex flex-col">
      <div className="flex w-full flex-grow overflow-hidden">
        <Sidebar />
        <div className="w-full h-full">
          <ChatPanel />
        </div>
      </div>
    </main>
  );
};

const ChatPanel = () => {
  const userId = useAuthStore((state) => state.user?.id);
  const activeChat = useChatStore((state) => state.activeChat);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const createChat = useChatStore((state) => state.createChat);
  const emitTypingStatus = useUserStore((state) => state.emitTypingStatus);
  const userStatuses = useUserStore((state) => state.userStatuses);
  const getChatPartner = useChatStore((state) => state.getChatPartner);
  const partner = activeChat ? getChatPartner(activeChat) : null;
  const typingStatus = userStatuses.get(partner?.id || 0)?.typing;
  const isTyping = typingStatus
    ? typingStatus.isTyping && typingStatus.chatId === activeChat?.id
    : false;

  if (!activeChat) {
    return <p>No chat selected</p>;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.querySelector('input');
    if (!input) return;

    const content = input.value;
    if (!content) return;

    const chatId = activeChat.id;
    if (!chatId) {
      await createChat({
        userIds: activeChat.members.map((member) => member.id),
        content,
      });
      input.value = '';
      return;
    }

    try {
      sendMessage(chatId, content);
    } catch (error) {
      console.error('Failed to send message', error);
    }

    input.value = '';
    emitTypingStatus(chatId, false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Chat header */}
      <div className="w-full p-4 bg-gray-800 text-white sticky top-0 shadow-md">
        <h2 className="text-lg text-center">
          {useChatStore.getState().getChatPartner(activeChat)?.username}
        </h2>
        <span className="text-center text-sm">
          {isTyping ? 'Typing...' : ''}
        </span>
      </div>

      {/* Messages list */}
      <div className="flex-grow p-4 overflow-y-auto">
        <ul className="space-y-4">
          {activeChat.messages.map((message) => (
            <li key={message.id}>
              <div
                className={`flex ${message.senderId === userId ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs p-4 rounded-lg shadow-md ${message.senderId === userId ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300'}`}
                >
                  <p>{message.content}</p>
                  <span
                    className={`text-xs  ${message.senderId === userId ? 'text-gray-300' : 'text-gray-500'} block text-right mt-1`}
                  >
                    {message.createdAt.toLocaleString()}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Input panel */}
      <div className="border-t border-gray-700 p-4 bg-gray-800">
        <form className="flex items-center space-x-4" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Escribe un mensaje..."
            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) => {
              const chatId = activeChat.id;

              if (!chatId) return;

              const isTyping = e.currentTarget.value.trim().length > 0;
              emitTypingStatus(chatId, isTyping);
            }}
          />
          <button
            type="submit"
            className="p-2 bg-blue-600 rounded-full hover:bg-blue-700 text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 12h14M12 5l7 7-7 7"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};
