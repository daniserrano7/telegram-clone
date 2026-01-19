import { localStorageService } from './local-storage.service';

interface NotificationServiceConfig {
  vapidPublicKey: string;
}

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// API response types
interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
}

class NotificationService {
  private vapidPublicKey: string = '';
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private pushSubscription: PushSubscription | null = null;

  constructor() {
    this.initializeServiceWorker();
  }

  // Initialize Service Worker
  private async initializeServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Workers are not supported');
      return;
    }

    try {
      this.serviceWorkerRegistration = await navigator.serviceWorker.register(
        '/sw.js',
        {
          scope: '/',
          updateViaCache: 'none' // Force service worker updates in Chrome
        }
      );

      console.log('Service Worker registered:', this.serviceWorkerRegistration);

      // Listen for Service Worker updates
      this.serviceWorkerRegistration.addEventListener('updatefound', () => {
        console.log('New Service Worker version found');
      });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  // Configure VAPID public key
  setVapidPublicKey(publicKey: string): void {
    this.vapidPublicKey = publicKey;
  }

  // Check if browser supports notifications
  isNotificationSupported(): boolean {
    return (
      'Notification' in window &&
      'serviceWorker' in navigator &&
      'PushManager' in window
    );
  }

  // Check current permission status
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isNotificationSupported()) {
      throw new Error('Notifications are not supported in this browser');
    }

    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  }

  // Subscribe to push notifications
  async subscribeToPush(): Promise<PushSubscriptionData | null> {
    if (!this.serviceWorkerRegistration) {
      throw new Error('Service Worker not registered');
    }

    if (!this.vapidPublicKey) {
      throw new Error('VAPID public key not configured');
    }

    if (this.getPermissionStatus() !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    try {
      // Check for existing subscription
      this.pushSubscription =
        await this.serviceWorkerRegistration.pushManager.getSubscription();

      if (!this.pushSubscription) {
        // Create new subscription
        this.pushSubscription =
          await this.serviceWorkerRegistration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array(
              this.vapidPublicKey
            ) as any,
          });
      }

      const subscriptionData = this.extractSubscriptionData(
        this.pushSubscription
      );

      // Save subscription to backend
      await this.saveSubscriptionToBackend(subscriptionData);

      console.log('Push subscription created and saved:', subscriptionData);
      return subscriptionData;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPush(): Promise<boolean> {
    if (this.pushSubscription) {
      try {
        const subscriptionData = this.extractSubscriptionData(
          this.pushSubscription
        );

        // Remove from backend first
        await this.removeSubscriptionFromBackend(subscriptionData.endpoint);

        const unsubscribed = await this.pushSubscription.unsubscribe();
        this.pushSubscription = null;
        console.log('Unsubscribed from push notifications');
        return unsubscribed;
      } catch (error) {
        console.error('Failed to unsubscribe from push notifications:', error);
        return false;
      }
    }
    return true;
  }

  // Get current subscription
  async getCurrentSubscription(): Promise<PushSubscriptionData | null> {
    if (!this.serviceWorkerRegistration) {
      return null;
    }

    try {
      const subscription =
        await this.serviceWorkerRegistration.pushManager.getSubscription();
      return subscription ? this.extractSubscriptionData(subscription) : null;
    } catch (error) {
      console.error('Failed to get current subscription:', error);
      return null;
    }
  }

  // Show local notification (for testing)
  async showLocalNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<void> {
    if (this.getPermissionStatus() !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    const defaultOptions: NotificationOptions = {
      body: 'New message received',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'local-notification',
      requireInteraction: false,
    };

    const notification = new Notification(title, {
      ...defaultOptions,
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto close after 5 seconds
    setTimeout(() => {
      notification.close();
    }, 5000);
  }

  // Utility: Convert VAPID key to Uint8Array
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    // Create ArrayBuffer first, then Uint8Array to ensure proper typing
    const buffer = new ArrayBuffer(rawData.length);
    const outputArray = new Uint8Array(buffer);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Utility: Extract subscription data
  private extractSubscriptionData(
    subscription: PushSubscription
  ): PushSubscriptionData {
    const p256dh = subscription.getKey('p256dh') as any;
    const auth = subscription.getKey('auth') as any;

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: p256dh ? this.arrayBufferToBase64(p256dh) : '',
        auth: auth ? this.arrayBufferToBase64(auth) : '',
      },
    };
  }

  // Utility: Convert ArrayBuffer to base64
  private arrayBufferToBase64(buffer: any): string {
    if (!buffer) return '';
    
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  // Backend API Methods
  private async saveSubscriptionToBackend(
    subscriptionData: PushSubscriptionData
  ): Promise<void> {
    const user = localStorageService.get('user');
    const token = user?.token;
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/notifications/subscribe`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(subscriptionData),
        }
      );

      const result: ApiResponse = await response.json();

      if (!response.ok || result.status === 'error') {
        throw new Error(result.message || 'Failed to save subscription');
      }

      console.log('Subscription saved to backend successfully');
    } catch (error) {
      console.error('Failed to save subscription to backend:', error);
      throw error;
    }
  }

  private async removeSubscriptionFromBackend(endpoint: string): Promise<void> {
    const user = localStorageService.get('user');
    const token = user?.token;
    if (!token) {
      console.warn('No authentication token found for unsubscribe');
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/notifications/unsubscribe`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ endpoint }),
        }
      );

      const result: ApiResponse = await response.json();

      if (!response.ok || result.status === 'error') {
        throw new Error(result.message || 'Failed to remove subscription');
      }

      console.log('Subscription removed from backend successfully');
    } catch (error) {
      console.error('Failed to remove subscription from backend:', error);
      // Don't throw error here to allow local unsubscribe to proceed
    }
  }

  // Send test notification via backend
  async sendTestNotification(): Promise<void> {
    const user = localStorageService.get('user');
    const token = user?.token;
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/notifications/test`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result: ApiResponse = await response.json();

      if (!response.ok || result.status === 'error') {
        throw new Error(result.message || 'Failed to send test notification');
      }

      console.log('Test notification sent via backend');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
export type { NotificationServiceConfig, PushSubscriptionData };
