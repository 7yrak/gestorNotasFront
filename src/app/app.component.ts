import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { PageEditorComponent } from './components/page-editor/page-editor.component';
import { StateService } from './services/state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SidebarComponent, PageEditorComponent],
  template: `
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
  `
})
export class AppComponent {
  constructor(public state: StateService) {}
}
