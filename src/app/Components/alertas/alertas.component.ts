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
