// auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    console.log('AuthGuard checking authentication...');
    const isAuth = this.authService.isAuthenticated();
    console.log('Is authenticated:', isAuth);

    if (isAuth) {
      return true;
    }

    console.log('Redirecting to login...');
    this.router.navigate(['/login']);
    return false;
  }
}
