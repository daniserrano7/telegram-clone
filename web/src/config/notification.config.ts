export const notificationConfig = {
  vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY || '',
  
  // Notification defaults
  defaults: {
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    requireInteraction: false,
    tag: 'telegram-clone-notification'
  },
  
  // Check if VAPID key is configured
  isConfigured(): boolean {
    return !!this.vapidPublicKey && this.vapidPublicKey !== 'your-vapid-public-key-here';
  }
};

// Initialize notification service with VAPID key
import { notificationService } from '../services/notification.service';

if (notificationConfig.isConfigured()) {
  notificationService.setVapidPublicKey(notificationConfig.vapidPublicKey);
} else {
  console.warn('VAPID public key not configured. Push notifications will not work.');
}