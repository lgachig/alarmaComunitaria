import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AlertaMapService } from '../alertas/alerta-map.service';
import { Alerta } from '../alertas/alertas.component';

@Component({
  selector: 'app-mapa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./mapa.component.html",
  styleUrls: ["./mapa.component.scss"]
})
export class MapaComponent implements OnInit, OnDestroy {
  isBrowser = false;
  private map: any;
  private L: any;
  private marcadores: any[] = [];
  private iconos: any = {};
  private marcadorSeleccionado: any = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,
    private alertaMapService: AlertaMapService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async ngOnInit() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    console.log('ngOnInit, isBrowser:', this.isBrowser);
    if (this.isBrowser) {
      await this.initMap();
      this.cargarPuntos();
      this.alertaMapService.alertaSeleccionada$.subscribe(alerta => {
        if (alerta && alerta.lat !== undefined && alerta.lng !== undefined) {
          this.centrarEnAlerta(alerta);
        }
      });
    }
  }

  ngOnDestroy() {
    if (this.isBrowser && this.map) {
      this.map.remove();
    }
  }

  private async initMap() {
    this.L = await import('leaflet');

    // Centro del mapa en Quito (Plaza Grande)
    this.map = this.L.map('mapa').setView([-0.220164, -78.512327], 13);

    this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Crear iconos personalizados
    this.iconos = {
      robo: this.L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/2784/2784487.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      }),
      zonaSegura: this.L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/447/447031.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      }),
      camara: this.L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/126/126483.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      })
    };
  }

  private datosMarcadores: any;

  cargarPuntos() {
    this.http.get<any[]>('http://localhost:3000/api/puntos').subscribe(puntos => {
      console.log('Datos recibidos de puntos:', puntos);
      this.datosMarcadores = {
        robos: puntos.filter(p => p.tipo === 'robo'),
        secuestros: puntos.filter(p => p.tipo === 'secuestro'),
        camaras: puntos.filter(p => p.tipo === 'camara')
      };
      this.mostrarRobos();
    });
  }

  mostrarRobos() {
    this.limpiarMarcadores();
    if (!this.datosMarcadores || !this.datosMarcadores.robos) {
      console.log('No hay datos de robos');
      return;
    }
    console.log('Mostrando robos:', this.datosMarcadores.robos);
    this.datosMarcadores.robos.forEach((robo: any) => {
      const marcador = this.L.marker([robo.lat, robo.lng], { icon: this.iconos.robo })
        .addTo(this.map)
        .bindPopup(`
          <b>${robo.titulo}</b><br>
          ${robo.descripcion}<br>
          <small>Fecha: ${robo.fecha}</small>
        `);
      this.marcadores.push(marcador);
    });
  }

  mostrarZonasSeguras() {
    this.limpiarMarcadores();
    if (!this.datosMarcadores || !this.datosMarcadores.secuestros) return;
    this.datosMarcadores.secuestros.forEach((zona: any) => {
      const marcador = this.L.marker([zona.lat, zona.lng], { icon: this.iconos.zonaSegura })
        .addTo(this.map)
        .bindPopup(`
          <b>${zona.titulo}</b><br>
          ${zona.descripcion}
        `);
      this.marcadores.push(marcador);
    });
  }

  mostrarCamaras() {
    this.limpiarMarcadores();
    if (!this.datosMarcadores || !this.datosMarcadores.camaras) return;
    this.datosMarcadores.camaras.forEach((camara: any) => {
      const marcador = this.L.marker([camara.lat, camara.lng], { icon: this.iconos.camara })
        .addTo(this.map)
        .bindPopup(`
          <b>${camara.titulo}</b><br>
          Tipo: ${camara.tipo || ''}
        `);
      this.marcadores.push(marcador);
    });
  }

  limpiarMarcadores() {
    if (this.marcadores && this.marcadores.length) {
      this.marcadores.forEach(marcador => {
        if (this.map.hasLayer(marcador)) {
          this.map.removeLayer(marcador);
        }
      });
    }
    this.marcadores = [];
    // No tocar this.marcadorSeleccionado aquí
  }

  limpiarTodo() {
    this.limpiarMarcadores();
    if (this.marcadorSeleccionado && this.map.hasLayer(this.marcadorSeleccionado)) {
      this.map.removeLayer(this.marcadorSeleccionado);
      this.marcadorSeleccionado = null;
    }
  }

  // Método para centrar y resaltar un punto
  public centrarEnAlerta(alerta: { lat?: number, lng?: number, mensaje?: string, raw?: any }) {
    if (!this.isBrowser || !this.map || alerta.lat === undefined || alerta.lng === undefined) return;
    // Elimina el marcador seleccionado anterior
    if (this.marcadorSeleccionado && this.map.hasLayer(this.marcadorSeleccionado)) {
      this.map.removeLayer(this.marcadorSeleccionado);
    }
    this.map.setView([alerta.lat, alerta.lng], 16, { animate: true });
    const icon = this.iconos[alerta.raw?.tipo || 'robo'] || this.iconos.robo;
    this.marcadorSeleccionado = this.L.marker([alerta.lat, alerta.lng], { icon })
      .addTo(this.map)
      .bindPopup(`<b>${alerta.raw?.titulo || ''}</b><br>${alerta.mensaje || ''}`)
      .openPopup();
  }
}
