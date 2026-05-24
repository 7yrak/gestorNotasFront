import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { StateService } from '../../services/state.service';
import { Notebook, Section, Page } from '../../models/types';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <aside class="w-96 h-screen flex flex-col bg-gray-50 dark:bg-gray-800/95 border-r border-gray-200 dark:border-gray-800 transition-colors shadow-sm shrink-0">
      <!-- Logo de la app y alternador de tema -->
      <div class="px-6 py-5 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 shrink-0">
        <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
          <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </div>
          <span class="tracking-tight">GestorNotas</span>
        </h1>
        <button (click)="toggleTheme()" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors focus:outline-none" title="Cambiar Tema">
          <svg *ngIf="isDarkTheme" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
          <svg *ngIf="!isDarkTheme" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
        </button>
      </div>

      <!-- Navegación Árbol -->
      <div class="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        <div class="flex items-center justify-between px-2 pb-2 mt-2">
          <span class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Tu Librería</span>
          <button (click)="addNotebook()" class="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="Nuevo Cuaderno">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          </button>
        </div>

        <!-- Cuadernos -->
        <div *ngFor="let notebook of notebooks" class="select-none group mb-2"
             draggable="true" (dragstart)="onDragStart($event, notebook, 'notebook')" (dragover)="onDragOver($event)" (drop)="onDrop($event, notebook, 'notebook')">
          <div
            class="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer hover:bg-gray-200/50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 transition-all"
            (click)="toggleNotebook(notebook.notebookId)"
          >
            <div class="flex items-start gap-3 font-semibold text-sm w-full pr-2">
              <span class="text-gray-400 dark:text-gray-500 text-xs w-4 text-center transition-transform" [class.rotate-90]="expandedNotebooks[notebook.notebookId]">▶</span>
              <span class="w-3 h-3 rounded-full shadow-sm shrink-0 mt-1" [style.backgroundColor]="notebook.color || '#4f46e5'"></span>
              <span class="whitespace-normal break-words leading-tight flex-1 py-0.5">{{ notebook.name }}</span>
            </div>
            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button (click)="editNotebook($event, notebook)" class="p-1 text-gray-400 hover:text-blue-500 transition-colors rounded" title="Editar Cuaderno">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
              </button>
              <button (click)="addSection($event, notebook.notebookId)" class="p-1 text-gray-400 hover:text-emerald-500 transition-colors rounded" title="Nueva Sección">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
              </button>
              <button (click)="deleteNotebook(notebook); $event.stopPropagation()" class="p-1 text-gray-400 hover:text-red-500 transition-colors rounded" title="Eliminar Cuaderno">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </div>

          <!-- Secciones -->
          <div *ngIf="expandedNotebooks[notebook.notebookId]" class="ml-5 border-l-2 border-gray-100 dark:border-gray-700/50 pl-2 mt-1 mb-2 space-y-1">
            <div *ngFor="let section of sectionsMap[notebook.notebookId]" class="group/section"
                 draggable="true" (dragstart)="onDragStart($event, section, 'section')" (dragover)="onDragOver($event)" (drop)="onDrop($event, section, 'section')">
              <div
                class="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-200/50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-400 transition-all"
                (click)="toggleSection(section.sectionId)"
              >
                <div class="flex items-start gap-2 text-sm font-medium w-full pr-2">
                  <span class="text-gray-400 dark:text-gray-500 text-xs w-4 text-center transition-transform" [class.rotate-90]="expandedSections[section.sectionId]">▶</span>
                  <span class="text-lg leading-none" [style.color]="section.color || '#ef4444'">#</span>
                  <span class="whitespace-normal break-words leading-tight flex-1 py-0.5">{{ section.name }}</span>
                </div>
                <div class="flex gap-1 opacity-0 group-hover/section:opacity-100 transition-opacity">
                  <button (click)="editSection($event, section)" class="p-1 text-gray-400 hover:text-blue-500 transition-colors rounded" title="Editar Sección">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                  </button>
                  <button (click)="addPage($event, notebook, section)" class="p-1 text-gray-400 hover:text-emerald-500 transition-colors rounded" title="Nueva Página">
                     <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
                  </button>
                  <button (click)="deleteSection($event, section)" class="p-1 text-gray-400 hover:text-red-500 transition-colors rounded" title="Eliminar Sección">
                     <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>

              <!-- Páginas -->
              <div *ngIf="expandedSections[section.sectionId]" class="ml-6 border-l border-gray-100 dark:border-gray-700/50 pl-2 mt-1 space-y-0.5">
                <div *ngFor="let page of pagesMap[section.sectionId]"
                     class="flex items-center justify-between px-3 py-1.5 rounded-md cursor-pointer text-sm transition-all group/page"
                     [ngClass]="state.selectedPage()?.pageId === page.pageId ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold' : 'hover:bg-gray-200/50 dark:hover:bg-gray-700/50 text-gray-500 dark:text-gray-400'"
                     (click)="onSelectPage(page, section, notebook)"
                     draggable="true" (dragstart)="onDragStart($event, page, 'page')" (dragover)="onDragOver($event)" (drop)="onDrop($event, page, 'page')"
                >
                  <div class="flex items-start gap-2 w-full pr-2">
                    <svg class="w-3.5 h-3.5 shrink-0 opacity-70 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/></svg>
                    <span class="whitespace-normal break-words leading-tight flex-1">{{ page.title || 'Sin título' }}</span>
                  </div>
                  <div class="flex gap-1 opacity-0 group-hover/page:opacity-100 transition-opacity">
                    <button (click)="editPage($event, page)" class="p-1 text-gray-400 hover:text-blue-500 transition-colors rounded" title="Editar Página">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    </button>
                    <button (click)="deletePage($event, page)" class="p-1 text-gray-400 hover:text-red-500 transition-colors rounded" title="Eliminar Página">
                      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL ELEGANTE PARA EDITAR/CREAR ELEMENTOS -->
      <div *ngIf="isModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm transition-opacity">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all border border-gray-100 dark:border-gray-700">
          
          <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ modalTitle }}</h3>
            <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-md transition-colors outline-none" (click)="closeModal()">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div class="px-6 py-6">
            <input 
              type="text" 
              class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none" 
              [placeholder]="modalPlaceholder" 
              [(ngModel)]="modalValue"
              (keyup.enter)="saveModal()"
              autofocus
            />
          </div>

          <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800/80 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
            <button 
              class="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200/70 dark:hover:bg-gray-700 rounded-lg transition-colors"
              (click)="closeModal()">
              Cancelar
            </button>
            <button 
              class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-colors"
              (click)="saveModal()">
              Guardar
            </button>
          </div>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.5); border-radius: 10px; }
    .custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: rgba(107, 114, 128, 0.8); }
  `]
})
export class SidebarComponent implements OnInit {
  notebooks: Notebook[] = [];
  sectionsMap: { [notebookId: string]: Section[] } = {};
  pagesMap: { [sectionId: string]: Page[] } = {};

  expandedNotebooks: { [id: string]: boolean } = {};
  expandedSections: { [id: string]: boolean } = {};
  isDarkTheme = false;

  // Variables Drag and Drop
  draggedItem: any = null;
  draggedType: 'notebook' | 'section' | 'page' | null = null;

  // Variables Modal
  isModalOpen = false;
  modalTitle = '';
  modalValue = '';
  modalPlaceholder = '';
  modalAction: 'create-notebook' | 'create-section' | 'create-page' | 'edit-notebook' | 'edit-section' | 'edit-page' | null = null;
  modalContext: any = null;

  constructor(private api: ApiService, public state: StateService) {
    effect(() => {
      if (this.state.refreshTrigger() >= 0) {
        this.loadNotebooksTree();
      }
    });
  }

  ngOnInit() {
    this.isDarkTheme = document.documentElement.classList.contains('theme-dark');
    this.loadNotebooksTree();
  }

  toggleTheme() {
    this.isDarkTheme = !this.isDarkTheme;
    document.documentElement.classList.toggle('theme-dark', this.isDarkTheme);
    document.documentElement.classList.toggle('dark', this.isDarkTheme); // Garantiza soporte de utilidades "dark:" de Tailwind
  }

  loadNotebooksTree() {
    this.api.getNotebooks().subscribe({
      next: (books) => {
        this.notebooks = books;
        books.forEach(b => {
          this.expandedNotebooks[b.notebookId] = true; // Abrir por defecto
          this.loadSections(b.notebookId);
        });
      }
    });
  }

  loadSections(notebookId: string) {
    this.api.getSectionsByNotebook(notebookId).subscribe(secs => {
      this.sectionsMap[notebookId] = secs;
      secs.forEach(s => {
        this.expandedSections[s.sectionId] = true; // Abrir por defecto
        this.loadPages(s.sectionId);
      });
    });
  }

  loadPages(sectionId: string) {
    this.api.getPagesBySection(sectionId).subscribe(pags => {
      this.pagesMap[sectionId] = pags;
    });
  }

  toggleNotebook(id: string) {
    this.expandedNotebooks[id] = !this.expandedNotebooks[id];
  }

  toggleSection(id: string) {
    this.expandedSections[id] = !this.expandedSections[id];
  }

  onSelectPage(page: Page, section: Section, notebook: Notebook) {
    this.state.selectPage(page, section, notebook);
  }

  addNotebook() {
    this.openModal('create-notebook', 'Nuevo Cuaderno', 'Nombre del cuaderno...', '');
  }

  addSection(event: Event, notebookId: string) {
    event.stopPropagation();
    this.openModal('create-section', 'Nueva Sección', 'Nombre de la sección...', '', { notebookId });
  }

  addPage(event: Event, notebook: Notebook, section: Section) {
    event.stopPropagation();
    this.openModal('create-page', 'Nueva Página', 'Título de la página...', '', { notebook, section });
  }

  // --- Acciones de Edición (Renombrar) ---
  editNotebook(event: Event, notebook: Notebook) {
    event.stopPropagation();
    this.openModal('edit-notebook', 'Renombrar Cuaderno', 'Nuevo nombre...', notebook.name, { notebook });
  }

  editSection(event: Event, section: Section) {
    event.stopPropagation();
    this.openModal('edit-section', 'Renombrar Sección', 'Nuevo nombre...', section.name, { section });
  }

  editPage(event: Event, page: Page) {
    event.stopPropagation();
    this.openModal('edit-page', 'Renombrar Página', 'Nuevo título...', page.title, { page });
  }

  // --- Lógica del Modal Elegante ---
  openModal(action: any, title: string, placeholder: string, initialValue: string, context: any = null) {
    this.modalAction = action;
    this.modalTitle = title;
    this.modalPlaceholder = placeholder;
    this.modalValue = initialValue;
    this.modalContext = context;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.modalValue = '';
    this.modalContext = null;
  }

  saveModal() {
    if (!this.modalValue || this.modalValue.trim() === '') return;
    const val = this.modalValue.trim();

    switch (this.modalAction) {
      case 'create-notebook':
        this.api.createNotebook({
          userId: this.api.getMockUserId(),
          name: val,
          color: '#4f46e5',
          orderInUser: this.notebooks.length + 1
        }).subscribe(() => { this.state.triggerRefresh(); this.closeModal(); });
        break;

      case 'create-section':
        this.api.createSection({
          notebookId: this.modalContext.notebookId,
          name: val,
          color: '#ef4444',
          orderInParent: (this.sectionsMap[this.modalContext.notebookId]?.length || 0) + 1
        }).subscribe({
          next: () => {
            this.expandedNotebooks[this.modalContext.notebookId] = true;
            this.state.triggerRefresh();
            this.closeModal();
          },
          error: (err) => { alert('Error al crear sección.'); console.error(err); }
        });
        break;

      case 'create-page':
        this.api.createPage({
          sectionId: this.modalContext.section.sectionId,
          title: val,
          orderInSection: (this.pagesMap[this.modalContext.section.sectionId]?.length || 0) + 1,
          lastModifiedByUserId: this.api.getMockUserId(),
          version: 1
        }).subscribe({
          next: (newPage) => {
            this.expandedSections[this.modalContext.section.sectionId] = true;
            this.state.selectPage(newPage, this.modalContext.section, this.modalContext.notebook);
            this.state.triggerRefresh();
            this.closeModal();
          },
          error: (err) => { alert('Error al crear página.'); console.error(err); }
        });
        break;

      case 'edit-notebook':
        if (val !== this.modalContext.notebook.name) {
          this.api.updateNotebook(this.modalContext.notebook.notebookId, { name: val }).subscribe(() => {
            this.modalContext.notebook.name = val;
            this.state.triggerRefresh();
            this.closeModal();
          });
        } else this.closeModal();
        break;

      case 'edit-section':
        if (val !== this.modalContext.section.name) {
          this.api.updateSection(this.modalContext.section.sectionId, { name: val }).subscribe(() => {
            this.modalContext.section.name = val;
            this.state.triggerRefresh();
            this.closeModal();
          });
        } else this.closeModal();
        break;

      case 'edit-page':
        if (val !== this.modalContext.page.title) {
          this.api.updatePage(this.modalContext.page.pageId, { title: val }).subscribe(() => {
            this.modalContext.page.title = val;
            this.state.triggerRefresh();
            this.closeModal();
          });
        } else this.closeModal();
        break;
    }
  }

  // --- Lógica de Drag and Drop Visual ---
  onDragStart(event: DragEvent, item: any, type: 'notebook' | 'section' | 'page') {
    this.draggedItem = item;
    this.draggedType = type;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', type);
    }
    event.stopPropagation();
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); // Permitir el Drop
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  onDrop(event: DragEvent, targetItem: any, targetType: 'notebook' | 'section' | 'page') {
    event.preventDefault();
    event.stopPropagation();

    if (!this.draggedItem || this.draggedItem === targetItem || this.draggedType !== targetType) {
      return; // No hacer nada si soltamos en el mismo elemento o tipos distintos
    }

    // Intercambiar posiciones localmente para UX fluida
    if (targetType === 'notebook') {
      const draggedIdx = this.notebooks.findIndex(n => n.notebookId === this.draggedItem.notebookId);
      const targetIdx = this.notebooks.findIndex(n => n.notebookId === targetItem.notebookId);
      if (draggedIdx > -1 && targetIdx > -1) {
        const [moved] = this.notebooks.splice(draggedIdx, 1);
        this.notebooks.splice(targetIdx, 0, moved);
        // TODO: Puedes invocar a la API aquí para actualizar orderInUser
      }
    } else if (targetType === 'section' && this.draggedItem.notebookId === targetItem.notebookId) {
      const secs = this.sectionsMap[targetItem.notebookId];
      const draggedIdx = secs.findIndex(s => s.sectionId === this.draggedItem.sectionId);
      const targetIdx = secs.findIndex(s => s.sectionId === targetItem.sectionId);
      if (draggedIdx > -1 && targetIdx > -1) {
        const [moved] = secs.splice(draggedIdx, 1);
        secs.splice(targetIdx, 0, moved);
        // TODO: Llamada API para actualizar orderInParent
      }
    } else if (targetType === 'page' && this.draggedItem.sectionId === targetItem.sectionId) {
      const pags = this.pagesMap[targetItem.sectionId];
      const draggedIdx = pags.findIndex(p => p.pageId === this.draggedItem.pageId);
      const targetIdx = pags.findIndex(p => p.pageId === targetItem.pageId);
      if (draggedIdx > -1 && targetIdx > -1) {
        const [moved] = pags.splice(draggedIdx, 1);
        pags.splice(targetIdx, 0, moved);
        // TODO: Llamada API para actualizar orderInSection
      }
    }
    this.draggedItem = null;
    this.draggedType = null;
  }

  deleteNotebook(notebook: Notebook) {
    if (!confirm(`¿Eliminar el cuaderno "${notebook.name}"?`)) {
      return;
    }

    this.api.deleteNotebook(notebook.notebookId).subscribe({
      next: () => {
        this.state.clearSelection();
        this.state.triggerRefresh();
      },
      error: (err) => {
        alert('No se pudo eliminar el cuaderno.');
        console.error(err);
      }
    });
  }

  deleteSection(event: Event, section: Section) {
    event.stopPropagation();
    if (!confirm(`¿Eliminar la sección "${section.name}"?`)) {
      return;
    }

    this.api.deleteSection(section.sectionId).subscribe({
      next: () => {
        this.state.clearSelection();
        this.state.triggerRefresh();
      },
      error: (err) => {
        alert('No se pudo eliminar la sección.');
        console.error(err);
      }
    });
  }

  deletePage(event: Event, page: Page) {
    event.stopPropagation();
    if (!confirm(`¿Eliminar la página "${page.title || 'Sin título'}"?`)) {
      return;
    }

    this.api.deletePage(page.pageId).subscribe({
      next: () => {
        this.state.clearSelection();
        this.state.triggerRefresh();
      },
      error: (err) => {
        alert('No se pudo eliminar la página.');
        console.error(err);
      }
    });
  }
}
