import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NotificationButtonComponent } from '../notification-button/notification-button.component';
import { AlertPopupComponent } from '../alert-popup/alert-popup.component';
import { NotificationsPanelComponent } from '../notifications-panel/notifications-panel.component';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notification-demo',
  standalone: true,
  imports: [
    CommonModule,
    NotificationButtonComponent,
    AlertPopupComponent,
    NotificationsPanelComponent
  ],
  templateUrl: './notification-demo.component.html',
  styleUrls: ['./notification-demo.component.scss']
})
export class NotificationDemoComponent implements OnInit {
  isConnected = false;

  constructor(
    private notificationService: NotificationService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Solo inicializar en el navegador
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Conectar WebSocket (el servicio obtendrá el token automáticamente)
    this.notificationService.connectWebSocket();

    // Suscribirse al estado de conexión
    this.notificationService.isConnected$.subscribe(
      connected => this.isConnected = connected
    );
  }

  // Método para enviar notificación de prueba
  sendTestNotification(): void {
    const testPayload = {
      title: 'Alerta de Prueba',
      message: 'Esta es una notificación de prueba para demostrar el sistema.',
      alertType: 'general',
      location: 'Quito, Ecuador',
      imageUrl: 'https://via.placeholder.com/300x200/667eea/ffffff?text=Alerta+Comunitaria'
    };

    this.notificationService.sendNotification(testPayload).subscribe({
      next: () => console.log('Notificación de prueba enviada'),
      error: (error) => console.error('Error enviando notificación de prueba:', error)
    });
  }
}
