import { Injectable, signal } from '@angular/core';
import { Notebook, Section, Page } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  selectedNotebook = signal<Notebook | null>(null);
  selectedSection = signal<Section | null>(null);
  selectedPage = signal<Page | null>(null);
  pageUpdate = signal<Page | null>(null);
  sidebarOpen = signal<boolean>(window.innerWidth >= 900);

  // Señal disparadora para avisar al Sidebar que refresque la UI reactivamente
  refreshTrigger = signal<number>(0);

  selectPage(page: Page, section: Section, notebook: Notebook) {
    this.selectedNotebook.set(notebook);
    this.selectedSection.set(section);
    this.selectedPage.set(page);
    if (window.innerWidth < 900) this.sidebarOpen.set(false);
  }

  clearSelection() {
    this.selectedNotebook.set(null);
    this.selectedSection.set(null);
    this.selectedPage.set(null);
  }

  triggerRefresh() {
    this.refreshTrigger.update(v => v + 1);
  }

  updatePage(page: Page) {
    if (this.selectedPage()?.pageId === page.pageId) this.selectedPage.set(page);
    this.pageUpdate.set(page);
  }

  toggleSidebar() {
    this.sidebarOpen.update(open => !open);
  }
}
