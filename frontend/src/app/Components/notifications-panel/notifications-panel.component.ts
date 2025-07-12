import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { Notification } from '../../Share/interface/notification.interface';

@Component({
  selector: 'app-notifications-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications-panel.component.html',
  styleUrls: ['./notifications-panel.component.scss']
})
export class NotificationsPanelComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  isVisible = false;
  isLoading = false;
  selectedFilter = 'all';
  searchTerm = '';

  private subscriptions = new Subscription();

  // Filtros disponibles
  filters = [
    { value: 'all', label: 'Todas', icon: '📋' },
    { value: 'unread', label: 'No leídas', icon: '🔴' },
    { value: 'emergencia', label: 'Emergencias', icon: '🚨' },
    { value: 'robo', label: 'Robos', icon: '💰' },
    { value: 'seguridad', label: 'Seguridad', icon: '🛡️' },
    { value: 'general', label: 'Generales', icon: '📢' }
  ];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    // Suscribirse a las notificaciones
    this.subscriptions.add(
      this.notificationService.notifications$.subscribe(notifications => {
        this.notifications = notifications;
        this.applyFilters();
      })
    );

    // Cargar notificaciones del servidor
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  togglePanel(): void {
    this.isVisible = !this.isVisible;
    if (this.isVisible) {
      this.loadNotifications();
    }
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.notificationService.loadNotifications().subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.isLoading = false;
      }
    });
  }

  markAsRead(notification: Notification): void {
    this.notificationService.markAsRead(notification.id);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  deleteNotification(notification: Notification): void {
    if (confirm('¿Estás seguro de que quieres eliminar esta notificación?')) {
      this.notificationService.deleteNotification(notification.id);
    }
  }

  clearAll(): void {
    if (confirm('¿Estás seguro de que quieres eliminar todas las notificaciones?')) {
      this.notificationService.clearAll();
    }
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  private applyFilters(): void {
    let filtered = [...this.notifications];

    // Aplicar filtro por tipo
    if (this.selectedFilter !== 'all') {
      if (this.selectedFilter === 'unread') {
        filtered = filtered.filter(n => !n.isRead);
      } else {
        filtered = filtered.filter(n => n.metadata?.alertType === this.selectedFilter);
      }
    }

    // Aplicar búsqueda
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(search) ||
        n.message.toLowerCase().includes(search) ||
        n.metadata?.location?.toLowerCase().includes(search)
      );
    }

    this.filteredNotifications = filtered;
  }

  getAlertTypeIcon(alertType?: string): string {
    switch (alertType) {
      case 'emergencia':
        return '🚨';
      case 'robo':
        return '💰';
      case 'seguridad':
        return '🛡️';
      default:
        return '📢';
    }
  }

  getAlertTypeClass(alertType?: string): string {
    switch (alertType) {
      case 'emergencia':
        return 'alert-emergency';
      case 'robo':
        return 'alert-theft';
      case 'seguridad':
        return 'alert-security';
      default:
        return 'alert-general';
    }
  }

  getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `hace ${days} día${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `hace ${minutes} min`;
    } else {
      return 'ahora';
    }
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.style.display = 'none';
    }
  }
}
