import { Routes } from '@angular/router';
import { EventComponent } from './pages/event/event.component';
import { HomeComponent } from './pages/home/home.component';
import { AdminComponent } from './pages/admin/admin.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const routes: Routes = [
  // { path: '', redirectTo: 'dashboard/Imesha-Damith', pathMatch: 'full' },
  { path: '', redirectTo: 'event/Piyumi-Nalin', pathMatch: 'full' },
  { path: 'event/:slug', component: EventComponent },
  { path: 'admin', component: AdminComponent },
  { path: 'dashboard/:slug', component: DashboardComponent }
];