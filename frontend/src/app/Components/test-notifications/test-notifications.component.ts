import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-test-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="test-container">
      <h2>🧪 Prueba de Notificaciones</h2>

      <div class="status-section">
        <h3>Estado de Conexión</h3>
        <p>WebSocket: <span [class]="isConnected ? 'connected' : 'disconnected'">
          {{ isConnected ? '✅ Conectado' : '❌ Desconectado' }}
        </span></p>
        <p>Token JWT: <span [class]="hasToken ? 'connected' : 'disconnected'">
          {{ hasToken ? '✅ Presente' : '❌ Ausente' }}
        </span></p>
      </div>

      <div class="actions-section">
        <h3>Acciones de Prueba</h3>

        <button (click)="connectWebSocket()" class="btn btn-primary">
          🔌 Conectar WebSocket
        </button>

        <button (click)="sendTestNotification()" class="btn btn-success">
          📤 Enviar Notificación de Prueba
        </button>

        <button (click)="sendServerNotification()" class="btn btn-warning">
          🖥️ Enviar desde Servidor
        </button>

        <button (click)="checkConnectedClients()" class="btn btn-info">
          👥 Ver Clientes Conectados
        </button>
      </div>

      <div class="logs-section">
        <h3>Logs</h3>
        <div class="logs-container">
          <div *ngFor="let log of logs" class="log-entry">
            <span class="timestamp">{{ log.timestamp }}</span>
            <span class="message">{{ log.message }}</span>
          </div>
        </div>
        <button (click)="clearLogs()" class="btn btn-secondary">Limpiar Logs</button>
      </div>
    </div>
  `,
  styles: [`
    .test-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .status-section, .actions-section, .logs-section {
      margin-bottom: 30px;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 8px;
    }

    .connected {
      color: green;
      font-weight: bold;
    }

    .disconnected {
      color: red;
      font-weight: bold;
    }

    .btn {
      margin: 5px;
      padding: 10px 15px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
    }

    .btn-primary { background-color: #007bff; color: white; }
    .btn-success { background-color: #28a745; color: white; }
    .btn-warning { background-color: #ffc107; color: black; }
    .btn-info { background-color: #17a2b8; color: white; }
    .btn-secondary { background-color: #6c757d; color: white; }

    .logs-container {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #ccc;
      padding: 10px;
      background-color: #f8f9fa;
      font-family: monospace;
      font-size: 12px;
    }

    .log-entry {
      margin-bottom: 5px;
      padding: 2px 0;
    }

    .timestamp {
      color: #666;
      margin-right: 10px;
    }

    .message {
      color: #333;
    }
  `]
})
export class TestNotificationsComponent implements OnInit {
  isConnected = false;
  hasToken = false;
  logs: Array<{timestamp: string, message: string}> = [];

  constructor(
    private notificationService: NotificationService,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.addLog('Componente de prueba inicializado');
      this.checkToken();

      // Suscribirse al estado de conexión
      this.notificationService.isConnected$.subscribe(
        connected => {
          this.isConnected = connected;
          this.addLog(`Estado de conexión WebSocket: ${connected ? 'Conectado' : 'Desconectado'}`);
        }
      );
    }
  }

  connectWebSocket(): void {
    this.addLog('Intentando conectar WebSocket...');
    this.notificationService.connectWebSocket();
  }

  sendTestNotification(): void {
    this.addLog('Enviando notificación de prueba...');
    const testPayload = {
      title: 'Alerta de Prueba',
      message: 'Esta es una notificación de prueba desde el componente',
      alertType: 'test',
      location: 'Quito, Ecuador',
      imageUrl: 'https://via.placeholder.com/300x200'
    };

    this.notificationService.sendNotification(testPayload).subscribe({
      next: (response) => {
        this.addLog(`✅ Notificación enviada exitosamente: ${JSON.stringify(response)}`);
      },
      error: (error) => {
        this.addLog(`❌ Error enviando notificación: ${error.message}`);
      }
    });
  }

  sendServerNotification(): void {
    this.addLog('Enviando notificación desde servidor...');
    const testPayload = {
      title: 'Alerta desde Servidor',
      message: 'Esta notificación fue enviada directamente desde el servidor',
      alertType: 'server',
      location: 'Quito, Ecuador',
      imageUrl: 'https://via.placeholder.com/300x200'
    };

    this.http.post('http://localhost:3000/api/test-notification', testPayload).subscribe({
      next: (response: any) => {
        this.addLog(`✅ Notificación del servidor enviada: ${response.connectedClients} clientes conectados`);
      },
      error: (error) => {
        this.addLog(`❌ Error enviando notificación del servidor: ${error.message}`);
      }
    });
  }

  checkConnectedClients(): void {
    this.addLog('Verificando clientes conectados...');
    this.http.get('http://localhost:3000/api/connected-clients').subscribe({
      next: (response: any) => {
        this.addLog(`👥 Clientes conectados: ${response.count}`);
        if (response.connectedClients.length > 0) {
          response.connectedClients.forEach((client: any, index: number) => {
            this.addLog(`  ${index + 1}. ${client.name} (${client.email})`);
          });
        }
      },
      error: (error) => {
        this.addLog(`❌ Error verificando clientes: ${error.message}`);
      }
    });
  }

  checkToken(): void {
    const token = localStorage.getItem('auth_token');
    this.hasToken = !!token;
    this.addLog(`Token JWT: ${this.hasToken ? 'Presente' : 'Ausente'}`);
  }

  addLog(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.logs.unshift({ timestamp, message });

    // Mantener solo los últimos 50 logs
    if (this.logs.length > 50) {
      this.logs = this.logs.slice(0, 50);
    }
  }

  clearLogs(): void {
    this.logs = [];
  }
}
