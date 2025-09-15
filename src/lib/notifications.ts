export interface NotificationItem {
  name: string;
  description: string;
  icon: string;
  color: string;
  time: string;
}

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

export const notifications: NotificationItem[] = Array.from({ length: 10 }, () => baseNotifications).flat();
