import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { PageEditorComponent } from './components/page-editor/page-editor.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SidebarComponent, PageEditorComponent],
  template: `
    <div class="flex h-screen w-screen overflow-hidden bg-white dark:bg-gray-900">
      <app-sidebar class="shrink-0 flex"></app-sidebar>
      <app-page-editor class="flex-1 min-w-0"></app-page-editor>
    </div>
  `
})
export class AppComponent {}
