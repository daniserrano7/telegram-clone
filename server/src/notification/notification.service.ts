import { Injectable, Logger } from '@nestjs/common';
import * as webpush from 'web-push';
import { DbService } from '../db/db.service';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly db: DbService) {
    this.initializeWebPush();
  }

  private initializeWebPush() {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@telegram-clone.com';

    if (!vapidPublicKey || !vapidPrivateKey) {
      this.logger.warn('VAPID keys not configured. Push notifications will not work.');
      return;
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    
    this.logger.log('Web push VAPID configured successfully');
  }

  // Store push subscription for a user
  async saveSubscription(userId: number, subscriptionData: PushSubscriptionData) {
    try {
      const subscription = await this.db.pushSubscription.upsert({
        where: {
          endpoint: subscriptionData.endpoint,
        },
        update: {
          p256dhKey: subscriptionData.keys.p256dh,
          authKey: subscriptionData.keys.auth,
          userId,
        },
        create: {
          endpoint: subscriptionData.endpoint,
          p256dhKey: subscriptionData.keys.p256dh,
          authKey: subscriptionData.keys.auth,
          userId,
        },
      });

      this.logger.log(`Push subscription saved for user ${userId}`);
      return subscription;
    } catch (error) {
      this.logger.error(`Failed to save subscription for user ${userId}:`, error);
      throw error;
    }
  }

  // Remove push subscription
  async removeSubscription(userId: number, endpoint: string) {
    try {
      await this.db.pushSubscription.deleteMany({
        where: {
          userId,
          endpoint,
        },
      });

      this.logger.log(`Push subscription removed for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to remove subscription for user ${userId}:`, error);
      throw error;
    }
  }

  // Get all subscriptions for a user
  async getUserSubscriptions(userId: number) {
    try {
      return await this.db.pushSubscription.findMany({
        where: {
          userId,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to get subscriptions for user ${userId}:`, error);
      return [];
    }
  }

  // Send notification to specific user
  async sendNotificationToUser(userId: number, payload: NotificationPayload) {
    const subscriptions = await this.getUserSubscriptions(userId);
    
    if (subscriptions.length === 0) {
      this.logger.debug(`No push subscriptions found for user ${userId}`);
      return;
    }

    const notificationPromises = subscriptions.map(subscription => 
      this.sendToSubscription(subscription, payload)
    );

    const results = await Promise.allSettled(notificationPromises);
    
    // Clean up invalid subscriptions
    const failedSubscriptions = results
      .map((result, index) => ({ result, subscription: subscriptions[index] }))
      .filter(({ result }) => result.status === 'rejected')
      .map(({ subscription }) => subscription);

    if (failedSubscriptions.length > 0) {
      await this.cleanupInvalidSubscriptions(failedSubscriptions);
    }

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    this.logger.log(`Sent ${successCount}/${subscriptions.length} notifications to user ${userId}`);
  }

  // Send notification to multiple users
  async sendNotificationToUsers(userIds: number[], payload: NotificationPayload) {
    const notificationPromises = userIds.map(userId => 
      this.sendNotificationToUser(userId, payload)
    );

    await Promise.allSettled(notificationPromises);
    this.logger.log(`Notification sent to ${userIds.length} users`);
  }

  // Send push notification to a single subscription
  private async sendToSubscription(subscription: any, payload: NotificationPayload) {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dhKey,
        auth: subscription.authKey,
      },
    };

    const notificationPayload = {
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/favicon.ico',
      badge: payload.badge || '/favicon.ico',
      tag: payload.tag || `notification-${Date.now()}`,
      data: payload.data,
    };

    try {
      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify(notificationPayload),
        {
          TTL: 3600, // 1 hour
        }
      );

      this.logger.debug(`Push notification sent to endpoint: ${subscription.endpoint.substring(0, 50)}...`);
    } catch (error) {
      this.logger.error(`Failed to send notification to subscription ${subscription.id}: ${error.message}`);
      
      // If subscription is invalid (410), we'll clean it up later
      if (error.statusCode === 410) {
        this.logger.warn(`Subscription ${subscription.id} is no longer valid`);
      }
      
      throw error;
    }
  }

  // Clean up invalid/expired subscriptions
  private async cleanupInvalidSubscriptions(subscriptions: any[]) {
    const subscriptionIds = subscriptions.map(sub => sub.id);
    
    try {
      await this.db.pushSubscription.deleteMany({
        where: {
          id: {
            in: subscriptionIds,
          },
        },
      });

      this.logger.log(`Cleaned up ${subscriptionIds.length} invalid subscriptions`);
    } catch (error) {
      this.logger.error('Failed to cleanup invalid subscriptions:', error);
    }
  }

  // Send new message notification
  async sendNewMessageNotification(senderId: number, recipientIds: number[], messageContent: string, chatId: number) {
    try {
      // Get sender info
      const sender = await this.db.user.findUnique({
        where: { id: senderId },
        select: { username: true, avatarUrl: true },
      });

      if (!sender) {
        this.logger.error(`Sender ${senderId} not found`);
        return;
      }

      // Filter out the sender from recipients (don't notify yourself)
      const realRecipients = recipientIds.filter(id => id !== senderId);

      if (realRecipients.length === 0) {
        this.logger.debug('No recipients to notify');
        return;
      }

      const payload: NotificationPayload = {
        title: `New message from ${sender.username}`,
        body: messageContent.length > 100 ? `${messageContent.substring(0, 100)}...` : messageContent,
        icon: sender.avatarUrl || '/favicon.ico',
        tag: `message-${chatId}`,
        data: {
          chatId,
          senderId,
          senderUsername: sender.username,
        },
      };

      await this.sendNotificationToUsers(realRecipients, payload);
    } catch (error) {
      this.logger.error('Failed to send new message notification:', error);
    }
  }
}