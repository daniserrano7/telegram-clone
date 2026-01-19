import { useState, useEffect } from 'react';
import { HiBell, HiBellSlash, HiXMark } from 'react-icons/hi2';
import cx from 'classix';
import { notificationService } from '../services/notification.service';
import { notificationConfig } from '../config/notification.config';

interface NotificationPermissionRequestProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
  showAsModal?: boolean;
  autoShow?: boolean;
}

export const NotificationPermissionRequest = ({
  onPermissionGranted,
  onPermissionDenied,
  showAsModal = false,
  autoShow = true,
}: NotificationPermissionRequestProps) => {
  const [permission, setPermission] =
    useState<NotificationPermission>('default');
  const [isVisible, setIsVisible] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // Check browser support
    if (!notificationService.isNotificationSupported()) {
      setIsSupported(false);
      return;
    }

    // Check current permission status
    const currentPermission = notificationService.getPermissionStatus();
    setPermission(currentPermission);

    // Auto show if permission is default and autoShow is enabled
    if (
      autoShow &&
      currentPermission === 'default' &&
      notificationConfig.isConfigured()
    ) {
      setIsVisible(true);
    }
  }, [autoShow]);

  const handleRequestPermission = async () => {
    if (!notificationConfig.isConfigured()) {
      console.error('VAPID key not configured');
      return;
    }

    setIsRequesting(true);

    try {
      const newPermission = await notificationService.requestPermission();
      setPermission(newPermission);

      if (newPermission === 'granted') {
        // Try to subscribe to push notifications
        await notificationService.subscribeToPush();
        onPermissionGranted?.();
        setIsVisible(false);
      } else {
        onPermissionDenied?.();
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      onPermissionDenied?.();
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onPermissionDenied?.();
  };

  // Don't render if not supported, not configured, or not visible
  if (!isSupported || !notificationConfig.isConfigured() || !isVisible) {
    return null;
  }

  // Don't show if already granted or permanently denied
  if (permission === 'granted' || permission === 'denied') {
    return null;
  }

  const content = (
    <div className="bg-background-primary border border-border rounded-lg p-6 shadow-lg max-w-md">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <HiBell className="w-6 h-6 text-primary" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-font mb-2">
            Enable Notifications
          </h3>
          <p className="text-sm text-font-subtle mb-4">
            Get notified instantly when you receive new messages, even when the
            app is closed.
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleRequestPermission}
              disabled={isRequesting}
              className={cx(
                'flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors',
                'bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isRequesting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Requesting...
                </div>
              ) : (
                'Enable Notifications'
              )}
            </button>

            <button
              onClick={handleDismiss}
              className="px-4 py-2 rounded-lg font-medium text-sm border border-border text-font-subtle hover:bg-elevation-hover transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>

        {!showAsModal && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-full hover:bg-elevation-hover transition-colors"
          >
            <HiXMark className="w-5 h-5 text-icon-subtle" />
          </button>
        )}
      </div>
    </div>
  );

  if (showAsModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="relative">
          {content}
          <button
            onClick={handleDismiss}
            className="absolute -top-2 -right-2 p-2 rounded-full bg-background-primary border border-border hover:bg-elevation-hover transition-colors"
          >
            <HiXMark className="w-4 h-4 text-icon-subtle" />
          </button>
        </div>
      </div>
    );
  }

  return <div className="fixed bottom-4 right-4 z-40 max-w-md">{content}</div>;
};

// Permission status indicator component
export const NotificationStatus = () => {
  const [permission, setPermission] =
    useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    if (!notificationService.isNotificationSupported()) {
      return;
    }

    const currentPermission = notificationService.getPermissionStatus();
    setPermission(currentPermission);

    if (currentPermission === 'granted') {
      const subscription = await notificationService.getCurrentSubscription();
      setIsSubscribed(!!subscription);
    }
  };

  const handleTestNotification = async () => {
    if (permission !== 'granted') return;

    try {
      // Try backend notification first (real push notification)
      await notificationService.sendTestNotification();
    } catch (error) {
      console.error(
        'Backend test notification failed, falling back to local:',
        error
      );

      // Fallback to local notification
      try {
        await notificationService.showLocalNotification(
          'Test Notification (Local)',
          {
            body: 'This is a local test notification. Backend notifications may not be configured.',
            icon: '/favicon.ico',
          }
        );
      } catch (localError) {
        console.error('Failed to show local test notification:', localError);
      }
    }
  };

  if (!notificationService.isNotificationSupported()) {
    return (
      <div className="flex items-center gap-2 text-font-subtle">
        <HiBellSlash className="w-5 h-5" />
        <span className="text-sm">Notifications not supported</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        {permission === 'granted' ? (
          <HiBell className="w-5 h-5 text-green-500" />
        ) : (
          <HiBellSlash className="w-5 h-5 text-font-subtle" />
        )}
        <div className="text-sm">
          <div className="font-medium text-font">
            {permission === 'granted' && 'Notifications Enabled'}
            {permission === 'denied' && 'Notifications Blocked'}
            {permission === 'default' && 'Notifications Not Set'}
          </div>
          {permission === 'granted' && (
            <div className="text-font-subtle">
              {isSubscribed
                ? 'Push notifications active'
                : 'Push notifications inactive'}
            </div>
          )}
        </div>
      </div>

      {permission === 'granted' && (
        <button
          onClick={handleTestNotification}
          className="px-3 py-1 text-xs bg-elevation-hover border border-border rounded-md hover:bg-elevation-hover/80 transition-colors text-font-subtle"
        >
          Test
        </button>
      )}
    </div>
  );
};
