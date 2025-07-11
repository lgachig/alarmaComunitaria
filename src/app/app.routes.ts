import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { DashboardComponent } from './Components/Inicio/Inicio.component';
import { AuthGuard } from './auth/Guards/auth.guard';
import { RegisterComponent } from './auth/registrar/registrar.component';
import { NotificationDemoComponent } from './Components/notification-demo/notification-demo.component';
import { TestNotificationsComponent } from './Components/test-notifications/test-notifications.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'notifications',
    component: NotificationDemoComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'test-notifications',
    component: TestNotificationsComponent,
    canActivate: [AuthGuard]
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
