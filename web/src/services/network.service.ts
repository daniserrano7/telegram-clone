type NetworkListener = (isOnline: boolean) => void;

class NetworkService {
  private isOnlineState: boolean = navigator.onLine;
  private listeners: Set<NetworkListener> = new Set();

  constructor() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private handleOnline = () => {
    this.isOnlineState = true;
    this.notifyListeners();
  };

  private handleOffline = () => {
    this.isOnlineState = false;
    this.notifyListeners();
  };

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.isOnlineState));
  }

  /**
   * Get current network status
   */
  isOnline(): boolean {
    return this.isOnlineState;
  }

  /**
   * Subscribe to network status changes
   * @returns Unsubscribe function
   */
  subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const networkService = new NetworkService();
