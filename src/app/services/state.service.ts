import { Injectable, signal } from '@angular/core';
import { Notebook, Section, Page } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  selectedNotebook = signal<Notebook | null>(null);
  selectedSection = signal<Section | null>(null);
  selectedPage = signal<Page | null>(null);

  // Señal disparadora para avisar al Sidebar que refresque la UI reactivamente
  refreshTrigger = signal<number>(0);

  selectPage(page: Page, section: Section, notebook: Notebook) {
    this.selectedNotebook.set(notebook);
    this.selectedSection.set(section);
    this.selectedPage.set(page);
  }

  clearSelection() {
    this.selectedNotebook.set(null);
    this.selectedSection.set(null);
    this.selectedPage.set(null);
  }

  triggerRefresh() {
    this.refreshTrigger.update(v => v + 1);
  }
}
