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
  mostrarVideo = false;
  estadoCamara = 'Conectando...';
  videoUrl = 'http://localhost:5003/'; // URL del stream de la cámara de PC
  statsCamara: any = {};

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

      // Verificar estado de la cámara de PC
      this.verificarEstadoCamara();

      // Actualizar estadísticas cada 5 segundos
      setInterval(() => {
        this.actualizarStatsCamara();
      }, 5000);
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
      }),
      camaraPC: this.L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/126/126483.png',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
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
      this.agregarMarcadorCamaraPC();
    });
  }

  // Agregar marcador específico para la cámara de PC
  agregarMarcadorCamaraPC() {
    const lat = -0.0626; // Ubicación de la cámara de PC
    const lng = -78.4516;

    const marcador = this.L.marker([lat, lng], { icon: this.iconos.camaraPC })
      .addTo(this.map)
      .bindPopup(`
        <b>🎥 Cámara de PC - Mac</b><br>
        <strong>Estado:</strong> <span id="estado-camara">${this.estadoCamara}</span><br>
        <strong>Personas detectadas:</strong> <span id="personas-detectadas">0</span><br>
        <strong>Armas detectadas:</strong> <span id="armas-detectadas">0</span><br>
        <button onclick="window.mostrarVideoEnVivo()" class="btn btn-primary btn-sm">
          📹 Ver Video en Vivo
        </button>
      `);

    this.marcadores.push(marcador);
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
    this.agregarMarcadorCamaraPC(); // Siempre mostrar la cámara de PC
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
    this.agregarMarcadorCamaraPC(); // Siempre mostrar la cámara de PC
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
    this.agregarMarcadorCamaraPC(); // Siempre mostrar la cámara de PC
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

  // Verificar estado de la cámara de PC
  verificarEstadoCamara() {
    this.http.get('http://localhost:5003/status').subscribe({
      next: (response: any) => {
        this.estadoCamara = response.camera_status || 'Conectado';
        console.log('Estado de cámara de PC:', response);
      },
      error: (error) => {
        this.estadoCamara = 'Desconectado';
        console.error('Error verificando estado de cámara:', error);
      }
    });
  }

  // Actualizar estadísticas de la cámara
  actualizarStatsCamara() {
    this.http.get('http://localhost:5003/stats').subscribe({
      next: (response: any) => {
        this.statsCamara = response;
        console.log('Stats de cámara:', response);

        // Actualizar marcador si existe
        this.actualizarMarcadorCamaraPC();
      },
      error: (error) => {
        console.error('Error obteniendo stats de cámara:', error);
      }
    });
  }

  // Actualizar marcador de la cámara de PC con nueva información
  actualizarMarcadorCamaraPC() {
    // Buscar y actualizar el marcador de la cámara de PC
    this.marcadores.forEach(marcador => {
      const latlng = marcador.getLatLng();
      if (latlng.lat === -0.0626 && latlng.lng === -78.4516) {
        marcador.setPopupContent(`
          <b>🎥 Cámara de PC - Mac</b><br>
          <strong>Estado:</strong> ${this.estadoCamara}<br>
          <strong>Personas detectadas:</strong> ${this.statsCamara.personas_detectadas || 0}<br>
          <strong>Armas detectadas:</strong> ${this.statsCamara.armas_detectadas || 0}<br>
          <button onclick="window.mostrarVideoEnVivo()" class="btn btn-primary btn-sm">
            📹 Ver Video en Vivo
          </button>
        `);
      }
    });
  }

  mostrarVideoEnVivo() {
    this.mostrarVideo = true;
    this.estadoCamara = 'Transmitiendo';
    console.log('Mostrando video en vivo desde cámara de PC');
  }

  ocultarVideo() {
    this.mostrarVideo = false;
    console.log('Ocultando video en vivo');
  }
}
