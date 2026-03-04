import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthGuard } from '../auth/auth.guard';

interface SaveSubscriptionDto {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface RemoveSubscriptionDto {
  endpoint: string;
}

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  async saveSubscription(
    @Request() req: any,
    @Body() subscriptionData: SaveSubscriptionDto,
  ) {
    const userId = req.user.id;
    
    await this.notificationService.saveSubscription(userId, subscriptionData);
    
    return {
      status: 'success',
      message: 'Push subscription saved successfully',
    };
  }

  @Delete('unsubscribe')
  @HttpCode(HttpStatus.OK)
  async removeSubscription(
    @Request() req: any,
    @Body() { endpoint }: RemoveSubscriptionDto,
  ) {
    const userId = req.user.id;
    
    await this.notificationService.removeSubscription(userId, endpoint);
    
    return {
      status: 'success',
      message: 'Push subscription removed successfully',
    };
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  async sendTestNotification(@Request() req: any) {
    const userId = req.user.id;

    const result = await this.notificationService.sendNotificationToUser(userId, {
      title: 'Test Notification',
      body: 'This is a test notification from your Telegram Clone app!',
      icon: '/favicon.ico',
      tag: 'test-notification',
      data: {
        type: 'test',
        timestamp: Date.now(),
      },
    });

    if (result.total === 0) {
      return {
        status: 'error',
        message: 'No push subscriptions found. Please enable notifications first.',
        data: result,
      };
    }

    if (result.sent === 0) {
      return {
        status: 'error',
        message: `Failed to send notification. ${result.failed} subscription(s) failed.`,
        data: result,
      };
    }

    return {
      status: 'success',
      message: `Test notification sent successfully to ${result.sent} device(s).`,
      data: result,
    };
  }
}