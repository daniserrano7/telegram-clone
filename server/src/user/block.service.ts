import { Injectable } from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { User } from '@prisma/client';

@Injectable()
export class BlockService {
  constructor(private readonly db: DbService) {}

  /**
   * Block a user
   * @param blockerId The ID of the user who is blocking
   * @param blockedId The ID of the user to block
   */
  async blockUser(blockerId: number, blockedId: number) {
    if (blockerId === blockedId) {
      throw new Error('Cannot block yourself');
    }

    // Check if already blocked
    const existing = await this.db.blockedUser.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    return this.db.blockedUser.create({
      data: {
        blockerId,
        blockedId,
      },
    });
  }

  /**
   * Unblock a user
   * @param blockerId The ID of the user who is unblocking
   * @param blockedId The ID of the user to unblock
   */
  async unblockUser(blockerId: number, blockedId: number) {
    return this.db.blockedUser.delete({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
      select: { id: true }, // Return something minimal
    });
  }

  /**
   * Check if user A has blocked user B
   * @param blockerId The ID of the potential blocker
   * @param blockedId The ID of the potential blocked user
   */
  async isBlocked(blockerId: number, blockedId: number): Promise<boolean> {
    const blocked = await this.db.blockedUser.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    return !!blocked;
  }

  /**
   * Check if either user blocked the other (bidirectional check)
   * @param userId1 First user ID
   * @param userId2 Second user ID
   */
  async isEitherBlocked(userId1: number, userId2: number): Promise<boolean> {
    const blocked1 = await this.isBlocked(userId1, userId2);
    const blocked2 = await this.isBlocked(userId2, userId1);

    return blocked1 || blocked2;
  }

  /**
   * Get all users blocked by a specific user
   * @param blockerId The ID of the user who is blocking
   */
  async getBlockedUsers(blockerId: number): Promise<User[]> {
    const blockedRelations = await this.db.blockedUser.findMany({
      where: { blockerId },
      include: { blocked: true },
    });

    return blockedRelations.map((rel) => rel.blocked);
  }

  /**
   * Get all users who have blocked a specific user
   * @param userId The ID of the user
   */
  async getBlockedByUsers(userId: number): Promise<User[]> {
    const blockedByRelations = await this.db.blockedUser.findMany({
      where: { blockedId: userId },
      include: { blocker: true },
    });

    return blockedByRelations.map((rel) => rel.blocker);
  }

  /**
   * Get block status for a user pair
   * @param userId1 First user ID
   * @param userId2 Second user ID
   */
  async getBlockStatus(
    userId1: number,
    userId2: number,
  ): Promise<{ isBlockedByMe: boolean; hasBlockedMe: boolean }> {
    const isBlockedByMe = await this.isBlocked(userId1, userId2);
    const hasBlockedMe = await this.isBlocked(userId2, userId1);

    return {
      isBlockedByMe,
      hasBlockedMe,
    };
  }
}
