import { Component, inject, OnInit } from '@angular/core';
import { KovaAuth } from './services/kova-auth';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { PageEditorComponent } from './components/page-editor/page-editor.component';
import { StateService } from './services/state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SidebarComponent, PageEditorComponent],
  template: `
    @if(auth.ready()) {
    <div class="kova-account"><span>Gestor de Notas · KOVA</span><a href="/kova/portal">Volver a KOVA</a><button type="button" (click)="auth.logout()">Cerrar sesión</button></div>
    <main class="app-shell">
      <button
        *ngIf="state.sidebarOpen()"
        class="sidebar-backdrop"
        aria-label="Cerrar navegación"
        (click)="state.sidebarOpen.set(false)"
      ></button>
      <app-sidebar [class.sidebar-visible]="state.sidebarOpen()"></app-sidebar>
      <app-page-editor></app-page-editor>
    </main>
    } @else {
      <main class="kova-access"><section aria-labelledby="access-title"><p>GESTOR DE NOTAS · KOVA</p><h1 id="access-title">Tus notas, en tu espacio</h1>
      @if(auth.loading()){<p role="status">Comprobando tu sesión…</p>}
      @else {<p role="status">{{auth.message()}}</p><button type="button" (click)="auth.login()">Ingresar con KOVA</button>}
      <a href="/kova/portal">Volver a KOVA</a></section></main>
    }
  `
})
export class AppComponent implements OnInit {
  readonly auth=inject(KovaAuth);
  ngOnInit(){this.auth.check();}
  constructor(public state: StateService) {}
}
