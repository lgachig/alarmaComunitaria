import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { NotificationPayload } from '../../Share/interface/notification.interface';

@Component({
  selector: 'app-notification-button',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notification-button.component.html',
  styleUrls: ['./notification-button.component.scss']
})
export class NotificationButtonComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  isConnected = false;
  isSending = false;
  showForm = false;

  // Formulario para nueva notificación
  notificationForm = {
    title: '',
    message: '',
    alertType: 'emergencia',
    location: '',
    imageUrl: ''
  };

  private subscriptions = new Subscription();

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    // Suscribirse al contador de notificaciones no leídas
    this.subscriptions.add(
      this.notificationService.unreadCount$.subscribe(
        count => this.unreadCount = count
      )
    );

    // Suscribirse al estado de conexión
    this.subscriptions.add(
      this.notificationService.isConnected$.subscribe(
        connected => this.isConnected = connected
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Mostrar/ocultar formulario
  toggleForm(): void {
    this.showForm = !this.showForm;
    if (this.showForm) {
      this.resetForm();
    }
  }

  // Enviar notificación
  sendNotification(): void {
    if (!this.isFormValid()) {
      return;
    }

    this.isSending = true;

    const payload: NotificationPayload = {
      title: this.notificationForm.title,
      message: this.notificationForm.message,
      alertType: this.notificationForm.alertType,
      location: this.notificationForm.location,
      imageUrl: this.notificationForm.imageUrl || undefined
    };

    this.notificationService.sendNotification(payload).subscribe({
      next: () => {
        console.log('Notificación enviada exitosamente');
        this.resetForm();
        this.showForm = false;
        this.isSending = false;
      },
      error: (error) => {
        console.error('Error al enviar notificación:', error);
        this.isSending = false;
      }
    });
  }

      // Validar formulario
  isFormValid(): boolean {
    return !!(this.notificationForm.title?.trim() &&
              this.notificationForm.message?.trim() &&
              this.notificationForm.location?.trim());
  }

  // Getter para validación del formulario
  get formIsValid(): boolean {
    return this.isFormValid();
  }

  // Resetear formulario
  private resetForm(): void {
    this.notificationForm = {
      title: '',
      message: '',
      alertType: 'emergencia',
      location: '',
      imageUrl: ''
    };
  }

  // Obtener clase CSS para el tipo de alerta
  getAlertTypeClass(): string {
    switch (this.notificationForm.alertType) {
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

  // Obtener icono para el tipo de alerta
  getAlertTypeIcon(): string {
    switch (this.notificationForm.alertType) {
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
}
