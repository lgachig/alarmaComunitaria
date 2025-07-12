import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { StorageService } from '../../services/storage.service';

const API_URL = 'http://localhost:3000/api/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {}

  login(credentials: any): Observable<any> {
    console.log('AuthService: Making login request to:', `${API_URL}/login`);
    console.log('AuthService: Credentials:', credentials);
    return this.http.post(`${API_URL}/login`, credentials).pipe(
      tap((response: any) => {
        if (response.success && response.token) {
          // Guardar token JWT
          this.storageService.setItem('auth_token', response.token);
          this.storageService.setItem('user', JSON.stringify(response.user));
          console.log('AuthService: Token saved:', response.token);

          // El WebSocket se conectará automáticamente cuando se necesite
        }
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${API_URL}/register`, userData);
  }

  // Método para obtener todos los usuarios (para administración)
  getUsers(): Observable<any> {
    return this.http.get('http://localhost:3000/api/users');
  }

  // Método para eliminar usuario
  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`http://localhost:3000/api/users/${userId}`);
  }

  logout(): Observable<any> {
    // Limpiar token del localStorage
    this.storageService.removeItem('auth_token');
    this.storageService.removeItem('user');
    return new Observable(observer => {
      observer.next({ success: true });
      observer.complete();
    });
  }

  isAuthenticated(): boolean {
    // Verificar si hay token en localStorage
    const token = this.storageService.getItem('auth_token');
    console.log('AuthService: Checking token:', token);
    return !!token;
  }

  getToken(): string | null {
    return this.storageService.getItem('auth_token');
  }

  getUser(): any {
    const userStr = this.storageService.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
}
