import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AlertaMapService } from './alerta-map.service';

export interface Alerta {
  tipo: 'alerta' | 'zona-segura';
  mensaje: string;
  hora: string;
  ubicacion?: string;
  usuario?: string;
  lat?: number;
  lng?: number;
  raw?: any; // para referencia al punto original
}

@Component({
  selector: 'app-alertas',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="alertas-container">
      <h2>INFORMACION EN TIEMPO REAL</h2>
      <div class="alertas-filtros">
        <button (click)="setFiltro('todos')" [class.active]="filtro === 'todos'">Todos</button>
        <button (click)="setFiltro('alerta')" [class.active]="filtro === 'alerta'">Alertas</button>
        <button (click)="setFiltro('zona-segura')" [class.active]="filtro === 'zona-segura'">Zonas Seguras</button>
      </div>
      <div class="alertas-list-scroll">
        <div class="alertas-list">
          <div *ngFor="let alerta of alertasFiltradas" class="alerta" [class.alerta-activa]="alerta.tipo === 'alerta'"
               [class.zona-segura]="alerta.tipo === 'zona-segura'" (click)="seleccionarAlerta(alerta)">
            <div class="alerta-header">
              <span *ngIf="alerta.tipo === 'alerta'">Alerta activada {{ alerta.usuario ? 'por ' + alerta.usuario : '' }}</span>
              <span *ngIf="alerta.tipo === 'zona-segura'">Zona segura detectada</span>
              <span class="hora">{{ alerta.hora }}</span>
            </div>
            <div class="alerta-content">
              <p>{{ alerta.mensaje }}</p>
              <p *ngIf="alerta.ubicacion" class="ubicacion">{{ alerta.ubicacion }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
<<<<<<< HEAD
    `.alertas-container { background-color: #f5f5f5; border-radius: 8px; padding: 1rem; font-family: 'Arial', sans-serif; max-width: 400px; margin: 0 auto; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h2 { color: #333; text-align: center; margin-bottom: 1.5rem; font-size: 1.2rem; text-transform: uppercase; letter-spacing: 1px; }
    .alertas-filtros { display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 1rem; }
    .alertas-filtros button { padding: 0.3rem 1rem; border: none; border-radius: 4px; background: #eee; cursor: pointer; font-weight: bold; }
    .alertas-filtros button.active { background: #3498db; color: white; }
    .alertas-list-scroll { max-height: 350px; overflow-y: auto; }
    .alertas-list { display: flex; flex-direction: column; gap: 1rem; }
    .alerta { background-color: white; border-radius: 6px; padding: 1rem; border-left: 4px solid #ccc; cursor: pointer; transition: background 0.2s; }
    .alerta:hover { background: #f0f0f0; }
    .alerta-activa { border-left-color: #e74c3c; }
    .zona-segura { border-left-color: #2ecc71; }
    .alerta-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-weight: bold; }
    .alerta-activa .alerta-header { color: #e74c3c; }
    .zona-segura .alerta-header { color: #2ecc71; }
    .hora { color: #7f8c8d; font-weight: normal; }
    .alerta-content p { margin: 0.2rem 0; }
    .ubicacion { font-style: italic; color: #3498db; }
=======
    `.alertas-container {
      background: white;
      border-radius: 12px;
      padding: 0.5rem 0.5rem 0.5rem 0.5rem;
      font-family: 'Arial', sans-serif;
      box-shadow: 0 8px 32px rgba(106, 13, 173, 0.15);
      border: 1px solid rgba(106, 13, 173, 0.1);
      width: 100%;
      height: 100%;
      max-width: none;
      margin: 0;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
      align-items: stretch;
      justify-content: flex-start;
    }
    h2 {
      color: var(--primary);
      text-align: center;
      margin-bottom: 1rem;
      font-size: 1.1rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 700;
    }
    .alertas-filtros {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    .alertas-filtros button {
      padding: 0.5rem 1rem;
      border: 2px solid rgba(106, 13, 173, 0.1);
      border-radius: 8px;
      background: var(--background-light);
      cursor: pointer;
      font-weight: 600;
      color: var(--text-secondary);
      transition: all 0.3s ease;
    }
    .alertas-filtros button:hover {
      background: rgba(106, 13, 173, 0.05);
      border-color: var(--primary);
      transform: translateY(-1px);
    }
    .alertas-filtros button.active {
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      color: white;
      border-color: var(--primary);
      box-shadow: 0 4px 12px rgba(106, 13, 173, 0.3);
    }
    .alertas-list-scroll {
      flex: 1 1 0;
      max-height: none;
      height: 100%;
      overflow-y: auto;
      min-height: 0;
      width: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
    }
    .alertas-list {
      display: flex;
      flex-direction: column;
      gap: 0.7rem;
      height: 100%;
      min-height: 0;
      width: 100%;
      box-sizing: border-box;
    }
    .alerta {
      background-color: white;
      border-radius: 8px;
      padding: 0.7rem 0.7rem;
      border-left: 4px solid #e2e8f0;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 1px solid rgba(106, 13, 173, 0.1);
      box-sizing: border-box;
      width: 100%;
      min-width: 0;
      word-break: break-word;
    }
    .alerta:hover {
      background: var(--background-light);
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(106, 13, 173, 0.1);
    }
    .alerta-activa {
      border-left-color: var(--danger);
      border-color: rgba(227, 52, 47, 0.2);
    }
    .zona-segura {
      border-left-color: var(--success);
      border-color: rgba(56, 193, 114, 0.2);
    }
    .alerta-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.3rem;
      font-weight: 600;
      font-size: 0.98rem;
    }
    .alerta-activa .alerta-header {
      color: var(--danger);
    }
    .zona-segura .alerta-header {
      color: var(--success);
    }
    .hora {
      color: var(--text-secondary);
      font-weight: normal;
    }
    .alerta-content p {
      margin: 0.15rem 0;
      color: var(--text-primary);
      font-size: 0.97rem;
    }
    .ubicacion {
      font-style: italic;
      color: var(--primary);
      font-weight: 500;
    }
>>>>>>> 83b7405 (Cambiado el diseno, con la paleta)
  `]
})
export class AlertasComponent implements OnInit {
  alertas: Alerta[] = [];
  filtro: 'todos' | 'alerta' | 'zona-segura' = 'todos';

  constructor(private http: HttpClient, private alertaMapService: AlertaMapService) {}

  ngOnInit() {
    this.cargarAlertas();
    setInterval(() => this.cargarAlertas(), 5000);
  }

  get alertasFiltradas() {
    if (this.filtro === 'todos') return this.alertas;
    return this.alertas.filter(a => a.tipo === this.filtro);
  }

  setFiltro(f: 'todos' | 'alerta' | 'zona-segura') {
    this.filtro = f;
  }

  seleccionarAlerta(alerta: Alerta) {
    this.alertaMapService.seleccionarAlerta(alerta);
  }

  cargarAlertas() {
    this.http.get<any[]>('http://localhost:3000/api/puntos').subscribe(puntos => {
      this.alertas = puntos.map(p => ({
        tipo: p.tipo === 'secuestro' || p.tipo === 'robo' ? 'alerta' : 'zona-segura',
        mensaje: p.descripcion,
        hora: p.fecha ? p.fecha.substring(11, 16) : '',
        ubicacion: p.direccion,
        usuario: p.usuarioId && p.usuarioId.name ? p.usuarioId.name : undefined,
        lat: p.lat,
        lng: p.lng,
        raw: p
      }));
    });
  }
}
