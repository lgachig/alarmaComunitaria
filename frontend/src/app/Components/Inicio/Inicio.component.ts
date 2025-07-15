import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { StorageService } from '../../services/storage.service';
import { MapaComponent } from '../mapa/mapa.component';
import { AlertasComponent } from '../alertas/alertas.component';
import { NotificationButtonComponent } from '../notification-button/notification-button.component';
import { AlertPopupComponent } from '../alert-popup/alert-popup.component';
import { NotificationsPanelComponent } from '../notifications-panel/notifications-panel.component';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MapaComponent,
    AlertasComponent,
    NotificationButtonComponent,
    AlertPopupComponent,
    NotificationsPanelComponent
  ],
  templateUrl: "./Inicio.component.html",
  styleUrls: ["./Inicio.component.scss"]
})
export class DashboardComponent implements OnInit {
  userInfo: any = null;
  isConnected = false;
  isPanicPulsing = false;
  private panicPulseTimeout: any = null;

  constructor(
    private storageService: StorageService,
    private notificationService: NotificationService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    const userStr = this.storageService.getItem('user');
    if (userStr) {
      this.userInfo = JSON.parse(userStr);
    }

    // Inicializar sistema de notificaciones solo en el navegador
    if (isPlatformBrowser(this.platformId)) {
      // El WebSocket ya se conectó en el login
      // Solo suscribirse al estado de conexión
      this.notificationService.isConnected$.subscribe(
        connected => this.isConnected = connected
      );
    }
  }

  logout() {
    this.storageService.removeItem('auth_token');
    this.storageService.removeItem('user');
    window.location.href = '/login';
  }

  onPanicClick() {
    alert('¡Botón de pánico presionado!');
    this.isPanicPulsing = true;
    if (this.panicPulseTimeout) {
      clearTimeout(this.panicPulseTimeout);
    }
    this.panicPulseTimeout = setTimeout(() => {
      this.isPanicPulsing = false;
    }, 10000); // 10 segundos
  }
}
