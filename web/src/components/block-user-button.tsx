import { useState } from 'react';
import cx from 'classix';
import { useBlockStore } from 'src/stores/block.store';

interface BlockUserButtonProps {
  userId: number;
}

export const BlockUserButton = ({ userId }: BlockUserButtonProps) => {
  const isBlocked = useBlockStore((state) => state.isBlocked(userId));
  const blockUser = useBlockStore((state) => state.blockUser);
  const unblockUser = useBlockStore((state) => state.unblockUser);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleBlock = async () => {
    setIsLoading(true);
    try {
      if (isBlocked) {
        await unblockUser(userId);
      } else {
        await blockUser(userId);
      }
    } catch (error) {
      console.error('Failed to toggle block status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleBlock}
      disabled={isLoading}
      className={cx(
        'w-full px-4 py-2 rounded-lg transition-colors font-medium text-sm',
        isBlocked
          ? 'bg-primary text-white hover:bg-primary/90 disabled:opacity-50'
          : 'bg-red-500 text-white hover:bg-red-600 disabled:opacity-50'
      )}
    >
      {isLoading ? 'Loading...' : isBlocked ? 'Unblock User' : 'Block User'}
    </button>
  );
};
