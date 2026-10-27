import { Component, inject, OnInit } from '@angular/core';
import { LocalAuth } from './services/local-auth';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { PageEditorComponent } from './components/page-editor/page-editor.component';
import { StateService } from './services/state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent, PageEditorComponent],
  template: `
    @if (auth.ready()) {
      <div class="local-account">
        <span>Gestor de Notas · {{ auth.username() }}</span>
        <button type="button" [disabled]="auth.loading()" (click)="auth.logout()">Cerrar sesión</button>
        @if (auth.message()) { <p role="alert">{{ auth.message() }}</p> }
      </div>
      <main class="app-shell">
        <button *ngIf="state.sidebarOpen()" class="sidebar-backdrop"
          aria-label="Cerrar navegación" (click)="state.sidebarOpen.set(false)"></button>
        <app-sidebar [class.sidebar-visible]="state.sidebarOpen()"></app-sidebar>
        <app-page-editor></app-page-editor>
      </main>
    } @else {
      <main class="local-access">
        <section aria-labelledby="access-title">
          <p>GESTOR DE NOTAS</p>
          <h1 id="access-title">Tus notas, en tu espacio</h1>
          <p>Ingresa con tu cuenta local.</p>
          <form (ngSubmit)="signIn()">
            <label for="username">Usuario</label>
            <input id="username" name="username" autocomplete="username" required
              [(ngModel)]="username" [disabled]="auth.loading()">
            <label for="password">Contraseña</label>
            <input id="password" name="password" type="password" autocomplete="current-password"
              required [(ngModel)]="password" [disabled]="auth.loading()">
            @if (auth.loading()) { <p role="status">Comprobando tu sesión…</p> }
            @if (auth.message()) { <p role="alert">{{ auth.message() }}</p> }
            <button type="submit" [disabled]="auth.loading() || !username.trim() || !password">Ingresar</button>
          </form>
        </section>
      </main>
    }
  `
})
export class AppComponent implements OnInit {
  readonly auth = inject(LocalAuth);
  username = '';
  password = '';
  constructor(public state: StateService) {}
  ngOnInit() { this.auth.check(); }
  signIn() {
    if (this.auth.loading() || !this.username.trim() || !this.password) return;
    this.state.clearSelection();
    this.auth.login(this.username, this.password);
    this.password = '';
  }
}
