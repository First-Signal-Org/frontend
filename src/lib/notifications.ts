export interface NotificationItem {
  name: string;
  description: string;
  icon: string;
  color: string;
  time: string;
  id?: string;
  timestamp?: number;
}

export type SignalStatus = 'sent' | 'delivered' | 'opened' | 'handle_revealed' | 'messaging';

export interface SignalNotification extends NotificationItem {
  signalId: string;
  status: SignalStatus;
  recipientName?: string;
}

// Signal status configurations
export const signalStatusConfig = {
  sent: {
    name: "Signal Sent",
    description: "Your signal has been sent successfully",
    icon: "📡",
    color: "#3B82F6",
  },
  delivered: {
    name: "Signal Delivered",
    description: "Your signal has been delivered to the recipient",
    icon: "✅",
    color: "#10B981",
  },
  opened: {
    name: "Envelope Opened",
    description: "The recipient has opened your signal",
    icon: "📮",
    color: "#F59E0B",
  },
  handle_revealed: {
    name: "Handle Revealed",
    description: "Your identity has been revealed to the recipient",
    icon: "🎭",
    color: "#8B5CF6",
  },
  messaging: {
    name: "Helena is Messaging You",
    description: "The recipient is now able to message you directly",
    icon: "💬",
    color: "#EF4444",
  },
};

const baseNotifications: NotificationItem[] = [
  {
    name: "First Signal here",
    description: "Get the help you need to confess",
    time: "15m ago",
    icon: "🪉",
    color: "#F2F2F2",
  },
  {
    name: "Someone got your signal",
    description: "Open the app to check the results",
    time: "10m ago",
    icon: "💘",
    color: "#F2F2F2",
  },
  {
    name: "Incoming signal",
    description: "Open the app to read more",
    time: "5m ago",
    icon: "💬",
    color: "#F2F2F2",
  },
  {
    name: "New event",
    description: "Check it out!",
    time: "2m ago",
    icon: "🗞️",
    color: "#F2F2F2",
  },
];

// Notification management
class NotificationManager {
  private notifications: NotificationItem[] = [];
  private listeners: Array<(notifications: NotificationItem[]) => void> = [];

  constructor() {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('signal-notifications');
      if (saved) {
        try {
          this.notifications = JSON.parse(saved);
        } catch (e) {
          console.warn('Failed to parse saved notifications:', e);
          this.notifications = [...baseNotifications];
        }
      } else {
        this.notifications = [...baseNotifications];
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('signal-notifications', JSON.stringify(this.notifications));
    }
  }

  private formatTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  addSignalNotification(signalId: string, status: SignalStatus, recipientName?: string) {
    const config = signalStatusConfig[status];
    const timestamp = Date.now();
    
    let description = config.description;
    if (recipientName && status === 'messaging') {
      description = `${recipientName} is now messaging you`;
    } else if (recipientName) {
      description = `${config.description} - ${recipientName}`;
    }

    const notification: SignalNotification = {
      id: `${signalId}-${status}-${timestamp}`,
      signalId,
      status,
      name: config.name,
      description,
      icon: config.icon,
      color: config.color,
      time: this.formatTime(timestamp),
      timestamp,
      recipientName,
    };

    // Add to beginning of array (most recent first)
    this.notifications.unshift(notification);
    
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.saveToStorage();
    this.notifyListeners();
  }

  getNotifications(): NotificationItem[] {
    // Update timestamps for display
    return this.notifications.map(notification => ({
      ...notification,
      time: notification.timestamp ? this.formatTime(notification.timestamp) : notification.time,
    }));
  }

  subscribe(listener: (notifications: NotificationItem[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getNotifications()));
  }

  clearNotifications() {
    this.notifications = [];
    this.saveToStorage();
    this.notifyListeners();
  }
}

export const notificationManager = new NotificationManager();

// For backwards compatibility
export const notifications: NotificationItem[] = notificationManager.getNotifications();
