import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { Notification } from '../../Share/interface/notification.interface';

@Component({
  selector: 'app-alert-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-popup.component.html',
  styleUrls: ['./alert-popup.component.scss']
})
export class AlertPopupComponent implements OnInit, OnDestroy {
  currentAlert: Notification | null = null;
  isVisible = false;
  private subscriptions = new Subscription();

  constructor(private notificationService: NotificationService) {}

      ngOnInit(): void {
    // Suscribirse a nuevas notificaciones individuales para mostrar alertas en tiempo real
    this.subscriptions.add(
      this.notificationService.newNotification$.subscribe(notification => {
        if (notification && !notification.isRead) {
          console.log('🔔 AlertPopup: Mostrando alerta en tiempo real:', notification.title);
          this.showAlert(notification);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  showAlert(notification: Notification): void {
    console.log('🔔 AlertPopup: Mostrando alerta para:', notification.title);
    this.currentAlert = notification;
    this.isVisible = true;
    console.log('🔔 AlertPopup: isVisible =', this.isVisible);

    // Auto-ocultar después de 8 segundos
    setTimeout(() => {
      console.log('🔔 AlertPopup: Auto-ocultando alerta');
      this.hideAlert();
    }, 8000);
  }

  hideAlert(): void {
    this.isVisible = false;
    setTimeout(() => {
      this.currentAlert = null;
    }, 300); // Esperar a que termine la animación
  }

  markAsRead(): void {
    if (this.currentAlert) {
      this.notificationService.markAsRead(this.currentAlert.id);
      this.hideAlert();
    }
  }

  getAlertTypeIcon(): string {
    if (!this.currentAlert?.metadata?.alertType) return '📢';

    switch (this.currentAlert.metadata.alertType) {
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

  getAlertTypeClass(): string {
    if (!this.currentAlert?.metadata?.alertType) return 'alert-general';

    switch (this.currentAlert.metadata.alertType) {
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
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    if (minutes > 0) {
      return `hace ${minutes} min`;
    } else {
      return `hace ${seconds} seg`;
    }
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.style.display = 'none';
    }
  }


}
