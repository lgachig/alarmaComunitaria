import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Notification } from '../Share/interface/notification.interface';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket: WebSocket | null = null;
  private connectionStatus = new BehaviorSubject<boolean>(false);
  private notificationSubject = new Subject<Notification>();

  public connectionStatus$ = this.connectionStatus.asObservable();
  public notifications$ = this.notificationSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  connect(token: string): void {
    // Solo conectar WebSocket en el navegador
    if (!isPlatformBrowser(this.platformId)) {
      console.log('WebSocket no disponible en el servidor');
      return;
    }

    try {
      console.log('🔌 Intentando conectar WebSocket con token:', token ? 'Token presente' : 'Sin token');

      // Conectar al WebSocket con el token JWT
      this.socket = new WebSocket(`ws://localhost:3000/ws?token=${token}`);

      this.socket.onopen = () => {
        console.log('✅ WebSocket conectado exitosamente');
        this.connectionStatus.next(true);
      };

            this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', data);

          if (data.type === 'new_notification') {
            console.log('📢 Nueva notificación recibida:', data.notification);
            this.notificationSubject.next(data.notification);
          } else if (data.type === 'notification_updated') {
            // Manejar actualización de notificación
            console.log('🔄 Notification updated:', data);
          } else if (data.type === 'all_notifications_read') {
            // Manejar todas las notificaciones marcadas como leídas
            console.log('✅ All notifications marked as read');
          } else if (data.type === 'notification_deleted') {
            // Manejar eliminación de notificación
            console.log('🗑️ Notification deleted:', data);
          } else if (data.type === 'notifications_list') {
            console.log('📋 Lista de notificaciones recibida:', data.notifications);
            // Procesar lista de notificaciones existentes
            data.notifications.forEach((notification: any) => {
              this.notificationSubject.next(notification);
            });
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('❌ WebSocket desconectado. Código:', event.code, 'Razón:', event.reason);
        this.connectionStatus.next(false);
        // Reconectar automáticamente después de 5 segundos
        setTimeout(() => {
          if (token) {
            console.log('🔄 Intentando reconectar WebSocket...');
            this.connect(token);
          }
        }, 5000);
      };

      this.socket.onerror = (error) => {
        console.error('❌ Error en WebSocket:', error);
        this.connectionStatus.next(false);
      };

    } catch (error) {
      console.error('Error al conectar WebSocket:', error);
      this.connectionStatus.next(false);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  sendNotification(notification: any): void {
    // Solo enviar en el navegador
    if (!isPlatformBrowser(this.platformId)) {
      console.log('WebSocket no disponible en el servidor');
      return;
    }

    console.log('📡 Enviando notificación por WebSocket:', notification);

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = {
        type: 'send_notification',
        notification
      };
      console.log('📤 Mensaje WebSocket a enviar:', message);
      this.socket.send(JSON.stringify(message));
      console.log('✅ Mensaje WebSocket enviado');
    } else {
      console.error('❌ WebSocket no está conectado. Estado:', this.socket?.readyState);
    }
  }

  isConnected(): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }
    return this.socket?.readyState === WebSocket.OPEN;
  }
}
