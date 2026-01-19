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
    
    await this.notificationService.sendNotificationToUser(userId, {
      title: 'Test Notification',
      body: 'This is a test notification from your Telegram Clone app!',
      icon: '/favicon.ico',
      tag: 'test-notification',
      data: {
        type: 'test',
        timestamp: Date.now(),
      },
    });
    
    return {
      status: 'success',
      message: 'Test notification sent successfully',
    };
  }
}