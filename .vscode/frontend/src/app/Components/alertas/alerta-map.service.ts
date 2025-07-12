import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Alerta } from './alertas.component';

@Injectable({ providedIn: 'root' })
export class AlertaMapService {
  private alertaSeleccionadaSubject = new BehaviorSubject<Alerta | null>(null);
  alertaSeleccionada$ = this.alertaSeleccionadaSubject.asObservable();

  seleccionarAlerta(alerta: Alerta) {
    this.alertaSeleccionadaSubject.next(alerta);
  }
}
