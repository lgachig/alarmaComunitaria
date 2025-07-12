export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  metadata?: {
    alertType: string;
    location: string;
    imageUrl?: string;
  };
}

export interface NotificationPayload {
  title: string;
  message: string;
  alertType: string;
  location: string;
  imageUrl?: string;
}
