import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Notification, NotificationPayload } from '../Share/interface/notification.interface';
import { WebSocketService } from './websocket.service';
import { StorageService } from './storage.service';
import { AuthService } from '../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([]);
  private unreadCount = new BehaviorSubject<number>(0);
  private isConnected = new BehaviorSubject<boolean>(false);
  private newNotification = new BehaviorSubject<Notification | null>(null);

  public notifications$ = this.notifications.asObservable();
  public unreadCount$ = this.unreadCount.asObservable();
  public isConnected$ = this.isConnected.asObservable();
  public newNotification$ = this.newNotification.asObservable();

  private readonly API_URL = 'http://localhost:3000/api'; // BACK-ENDV3
  private readonly STORAGE_KEY = 'notifications';

  constructor(
    private http: HttpClient,
    private webSocketService: WebSocketService,
    private storageService: StorageService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.initializeService();
  }

    private initializeService(): void {
    // Solo inicializar en el navegador
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Cargar notificaciones guardadas
    this.loadStoredNotifications();

    // Suscribirse a cambios de conexión WebSocket
    this.webSocketService.connectionStatus$.subscribe(
      connected => this.isConnected.next(connected)
    );

    // Suscribirse a nuevas notificaciones del WebSocket
    this.webSocketService.notifications$.subscribe(
      notification => {
        console.log('📥 Notificación recibida en el servicio:', notification);
        this.addNotification(notification);
      }
    );

    // No conectar WebSocket automáticamente aquí
    // Se conectará cuando el usuario se autentique
  }

  // Conectar WebSocket con token JWT
  connectWebSocket(): void {
    const token = this.authService.getToken();
    console.log('🔑 Token obtenido para WebSocket:', token ? 'Token presente' : 'Sin token');

    if (token) {
      console.log('🔌 Conectando WebSocket...');
      this.webSocketService.connect(token);
    } else {
      console.error('❌ No hay token JWT disponible para conectar WebSocket');
    }
  }

  // Enviar nueva notificación
  sendNotification(payload: NotificationPayload): Observable<any> {
    console.log('📤 Enviando notificación:', payload);

    // Mostrar alerta visual localmente
    this.showLocalAlert(payload);

    // Enviar al servidor (el interceptor agregará el token automáticamente)
    return this.http.post(`${this.API_URL}/notifications`, payload).pipe(
      tap((response) => {
        console.log('✅ Notificación enviada al servidor:', response);
        // También enviar por WebSocket para tiempo real
        this.webSocketService.sendNotification(payload);
      })
    );
  }

  // Mostrar alerta visual local
  private showLocalAlert(payload: NotificationPayload): void {
    // Crear notificación local
    const localNotification: Notification = {
      id: this.generateId(),
      title: payload.title,
      message: payload.message,
      timestamp: new Date(),
      isRead: false,
      metadata: {
        alertType: payload.alertType,
        location: payload.location,
        imageUrl: payload.imageUrl
      }
    };

    this.addNotification(localNotification);
  }

    // Agregar notificación a la lista
  private addNotification(notification: Notification): void {
    console.log('➕ Agregando notificación a la lista:', notification.title);

    const currentNotifications = this.notifications.value;
    const updatedNotifications = [notification, ...currentNotifications];

    console.log(`📊 Total de notificaciones: ${updatedNotifications.length}`);
    this.notifications.next(updatedNotifications);
    this.updateUnreadCount();
    this.saveNotifications(updatedNotifications);

        // Emitir la nueva notificación para alertas en tiempo real
    this.newNotification.next(notification);

    // Limpiar después de 1 segundo para evitar duplicados
    setTimeout(() => {
      this.newNotification.next(null);
    }, 1000);

    console.log('✅ Notificación agregada exitosamente');
  }

  // Marcar notificación como leída
  markAsRead(notificationId: string): void {
    const currentNotifications = this.notifications.value;
    const updatedNotifications = currentNotifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, isRead: true }
        : notification
    );

    this.notifications.next(updatedNotifications);
    this.updateUnreadCount();
    this.saveNotifications(updatedNotifications);

    // Actualizar en el servidor
    this.http.patch(`${this.API_URL}/notifications/${notificationId}/read`, {}).subscribe();
  }

  // Marcar todas como leídas
  markAllAsRead(): void {
    const currentNotifications = this.notifications.value;
    const updatedNotifications = currentNotifications.map(notification => ({
      ...notification,
      isRead: true
    }));

    this.notifications.next(updatedNotifications);
    this.updateUnreadCount();
    this.saveNotifications(updatedNotifications);

    // Actualizar en el servidor
    this.http.patch(`${this.API_URL}/notifications/read-all`, {}).subscribe();
  }

  // Obtener notificaciones del servidor
  loadNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.API_URL}/notifications`).pipe(
      tap(notifications => {
        this.notifications.next(notifications);
        this.updateUnreadCount();
        this.saveNotifications(notifications);
      })
    );
  }

  // Eliminar notificación
  deleteNotification(notificationId: string): void {
    const currentNotifications = this.notifications.value;
    const updatedNotifications = currentNotifications.filter(
      notification => notification.id !== notificationId
    );

    this.notifications.next(updatedNotifications);
    this.updateUnreadCount();
    this.saveNotifications(updatedNotifications);

    // Eliminar del servidor
    this.http.delete(`${this.API_URL}/notifications/${notificationId}`).subscribe();
  }

  // Obtener notificaciones no leídas
  getUnreadNotifications(): Observable<Notification[]> {
    return this.notifications$.pipe(
      map(notifications => notifications.filter(n => !n.isRead))
    );
  }

  // Actualizar contador de no leídas
  private updateUnreadCount(): void {
    const unreadCount = this.notifications.value.filter(n => !n.isRead).length;
    this.unreadCount.next(unreadCount);
  }

  // Persistencia local
  private saveNotifications(notifications: Notification[]): void {
    if (isPlatformBrowser(this.platformId)) {
      this.storageService.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
    }
  }

  private loadStoredNotifications(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const stored = this.storageService.getItem(this.STORAGE_KEY);
      if (stored) {
        const notifications = JSON.parse(stored);
        this.notifications.next(notifications);
        this.updateUnreadCount();
      }
    } catch (error) {
      console.error('Error loading stored notifications:', error);
    }
  }

  // Generar ID único
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Limpiar todas las notificaciones
  clearAll(): void {
    this.notifications.next([]);
    this.updateUnreadCount();
    this.storageService.removeItem(this.STORAGE_KEY);
  }
}
