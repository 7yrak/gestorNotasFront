import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, finalize, switchMap, tap } from 'rxjs/operators';
import { Notebook, Page, Section } from '../../models/types';
import { ApiService } from '../../services/api.service';
import { StateService } from '../../services/state.service';

type ModalAction = 'create-notebook' | 'create-section' | 'create-page' |
  'edit-notebook' | 'edit-section' | 'edit-page';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <aside class="sidebar">
      <header class="brand">
        <div class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></div>
        <div class="brand-copy">
          <strong>Margen</strong>
          <small>Tu espacio de ideas</small>
        </div>
        <button class="icon-button mobile-close" type="button" (click)="state.sidebarOpen.set(false)" aria-label="Cerrar navegación">×</button>
      </header>

      <div class="search-wrap">
        <label class="search-box">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"/></svg>
          <input [(ngModel)]="searchTerm" type="search" placeholder="Buscar en la biblioteca" aria-label="Buscar páginas y cuadernos">
          <kbd>⌘ K</kbd>
        </label>
      </div>

      <div class="library-heading">
        <div><span>Biblioteca</span><small>{{ totalPages }} páginas</small></div>
        <button class="new-button" type="button" (click)="addNotebook()"><b>+</b> Cuaderno</button>
      </div>

      <div class="tree" [class.tree-loading]="isLoading()" [attr.data-revision]="treeRevision()">
        <div *ngIf="isLoading()" class="status-card"><span class="spinner"></span> Ordenando tus notas…</div>
        <div *ngIf="loadError() && !isLoading()" class="status-card error">
          <span>{{ loadError() }}</span><button type="button" (click)="loadNotebooksTree()">Reintentar</button>
        </div>
        <div *ngIf="!isLoading() && !loadError() && !notebooks.length" class="empty-library">
          <div class="empty-sketch">N</div>
          <strong>Tu primera libreta</strong>
          <p>Crea un cuaderno y empieza a capturar ideas.</p>
          <button type="button" (click)="addNotebook()">Crear cuaderno</button>
        </div>

        <ng-container *ngFor="let notebook of filteredNotebooks; trackBy: trackNotebook">
          <section class="notebook" draggable="true"
            (dragstart)="onDragStart($event, notebook, 'notebook')"
            (dragover)="onDragOver($event)" (drop)="onDrop($event, notebook, 'notebook')">
            <div class="tree-row notebook-row" (click)="toggleNotebook(notebook.notebookId)">
              <button class="chevron" type="button" [attr.aria-expanded]="expandedNotebooks[notebook.notebookId]">›</button>
              <span class="book-dot" [style.background]="notebook.color || '#e55b3c'"></span>
              <span class="row-label">{{ notebook.name }}</span>
              <span class="row-count">{{ sectionsMap[notebook.notebookId].length || 0 }}</span>
              <div class="row-actions" (click)="$event.stopPropagation()">
                <button type="button" (click)="addSection($event, notebook.notebookId)" title="Nueva sección">+</button>
                <button type="button" (click)="editNotebook($event, notebook)" title="Renombrar">···</button>
              </div>
            </div>

            <div class="branch" *ngIf="expandedNotebooks[notebook.notebookId] || searchTerm">
              <ng-container *ngFor="let section of filteredSections(notebook.notebookId); trackBy: trackSection">
                <div class="section" draggable="true"
                  (dragstart)="onDragStart($event, section, 'section')"
                  (dragover)="onDragOver($event)" (drop)="onDrop($event, section, 'section')">
                  <div class="tree-row section-row" (click)="toggleSection(section.sectionId)">
                    <button class="chevron" type="button" [attr.aria-expanded]="expandedSections[section.sectionId]">›</button>
                    <span class="section-line" [style.background]="section.color || '#5d9c91'"></span>
                    <span class="row-label">{{ section.name }}</span>
                    <div class="row-actions" (click)="$event.stopPropagation()">
                      <button type="button" (click)="addPage($event, notebook, section)" title="Nueva página">+</button>
                      <button type="button" (click)="editSection($event, section)" title="Renombrar">···</button>
                    </div>
                  </div>

                  <div class="pages" *ngIf="expandedSections[section.sectionId] || searchTerm">
                    <button *ngFor="let page of filteredPages(section.sectionId); trackBy: trackPage"
                      class="page-row" type="button"
                      [class.active]="state.selectedPage()?.pageId === page.pageId"
                      (click)="onSelectPage(page, section, notebook)"
                      draggable="true" (dragstart)="onDragStart($event, page, 'page')"
                      (dragover)="onDragOver($event)" (drop)="onDrop($event, page, 'page')">
                      <span class="page-glyph">▱</span>
                      <span>{{ page.title || 'Sin título' }}</span>
                      <i (click)="editPage($event, page)" title="Renombrar">···</i>
                    </button>
                  </div>
                </div>
              </ng-container>
            </div>
          </section>
        </ng-container>

        <div *ngIf="searchTerm && !filteredNotebooks.length && !isLoading()" class="status-card">Sin resultados para “{{ searchTerm }}”.</div>
      </div>

      <footer class="sidebar-footer">
        <button type="button" class="profile"><span>TS</span><div><strong>Mi espacio</strong><small>Sincronización activa</small></div></button>
        <button type="button" class="icon-button" (click)="toggleTheme()" [title]="isDarkTheme ? 'Usar tema claro' : 'Usar tema oscuro'">
          {{ isDarkTheme ? '☀' : '◐' }}
        </button>
      </footer>
    </aside>

    <div *ngIf="isModalOpen" class="modal-backdrop" (mousedown)="closeModal()">
      <form class="modal" (submit)="saveModal(); $event.preventDefault()" (mousedown)="$event.stopPropagation()">
        <span class="modal-kicker">Organizar biblioteca</span>
        <h2>{{ modalTitle }}</h2>
        <label>Nombre<input name="modalValue" [(ngModel)]="modalValue" [placeholder]="modalPlaceholder" maxlength="255" autofocus></label>
        <p class="modal-error" *ngIf="actionError">{{ actionError }}</p>
        <div class="modal-actions">
          <button type="button" class="ghost" (click)="closeModal()">Cancelar</button>
          <button type="button" class="danger" *ngIf="isEditAction" (click)="deleteFromModal()">Eliminar</button>
          <button type="submit" class="primary" [disabled]="isActionPending || !modalValue.trim()">{{ isActionPending ? 'Guardando…' : 'Guardar' }}</button>
        </div>
      </form>
    </div>
  `,
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  notebooks: Notebook[] = [];
  sectionsMap: Record<string, Section[]> = {};
  pagesMap: Record<string, Page[]> = {};
  expandedNotebooks: Record<string, boolean> = {};
  expandedSections: Record<string, boolean> = {};
  searchTerm = '';
  isLoading = signal(true);
  loadError = signal('');
  treeRevision = signal(0);
  isDarkTheme = false;

  draggedItem: Notebook | Section | Page | null = null;
  draggedType: 'notebook' | 'section' | 'page' | null = null;

  isModalOpen = false;
  modalTitle = '';
  modalValue = '';
  modalPlaceholder = '';
  modalAction: ModalAction | null = null;
  modalContext: any = null;
  isActionPending = false;
  actionError = '';

  constructor(private api: ApiService, public state: StateService) {
    effect(() => {
      this.state.refreshTrigger();
      this.loadNotebooksTree();
    });
    effect(() => {
      const updatedPage = this.state.pageUpdate();
      if (!updatedPage) return;
      const pages = this.pagesMap[updatedPage.sectionId];
      const index = pages?.findIndex(page => page.pageId === updatedPage.pageId) ?? -1;
      if (index >= 0) {
        pages[index] = updatedPage;
        this.treeRevision.update(value => value + 1);
      }
    });
  }

  ngOnInit() {
    const preference = localStorage.getItem('gestor-notas-theme');
    this.isDarkTheme = preference ? preference === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    this.applyTheme();
  }

  @HostListener('document:keydown', ['$event'])
  focusSearch(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      document.querySelector<HTMLInputElement>('.search-box input')?.focus();
    }
  }

  get totalPages() { return Object.values(this.pagesMap).reduce((sum, pages) => sum + pages.length, 0); }
  get isEditAction() { return !!this.modalAction?.startsWith('edit-'); }
  get filteredNotebooks() { return this.notebooks.filter(book => this.matchesNotebook(book)); }

  trackNotebook = (_: number, item: Notebook) => item.notebookId;
  trackSection = (_: number, item: Section) => item.sectionId;
  trackPage = (_: number, item: Page) => item.pageId;

  matchesNotebook(notebook: Notebook) {
    const term = this.searchTerm.trim().toLocaleLowerCase();
    if (!term) return true;
    if (notebook.name.toLocaleLowerCase().includes(term)) return true;
    return (this.sectionsMap[notebook.notebookId] || []).some(section =>
      section.name.toLocaleLowerCase().includes(term) ||
      (this.pagesMap[section.sectionId] || []).some(page => page.title.toLocaleLowerCase().includes(term))
    );
  }

  filteredSections(notebookId: string) {
    const term = this.searchTerm.trim().toLocaleLowerCase();
    return (this.sectionsMap[notebookId] || []).filter(section => !term ||
      section.name.toLocaleLowerCase().includes(term) ||
      (this.pagesMap[section.sectionId] || []).some(page => page.title.toLocaleLowerCase().includes(term))
    );
  }

  filteredPages(sectionId: string) {
    const term = this.searchTerm.trim().toLocaleLowerCase();
    return (this.pagesMap[sectionId] || []).filter(page => !term || page.title.toLocaleLowerCase().includes(term));
  }

  toggleTheme() { this.isDarkTheme = !this.isDarkTheme; this.applyTheme(); }
  private applyTheme() {
    document.documentElement.classList.toggle('theme-dark', this.isDarkTheme);
    document.documentElement.classList.toggle('dark', this.isDarkTheme);
    localStorage.setItem('gestor-notas-theme', this.isDarkTheme ? 'dark' : 'light');
  }

  loadNotebooksTree() {
    this.isLoading.set(true);
    this.loadError.set('');
    this.api.getNotebooks().pipe(
      tap(books => {
        this.notebooks = books;
        this.sectionsMap = {};
        this.pagesMap = {};
        books.forEach(book => {
          this.expandedNotebooks[book.notebookId] ??= true;
          this.sectionsMap[book.notebookId] = [];
        });
        this.treeRevision.update(value => value + 1);
      }),
      switchMap(books => books.length ? forkJoin(books.map(book =>
        this.api.getSectionsByNotebook(book.notebookId).pipe(tap(sections => {
          this.sectionsMap[book.notebookId] = sections;
          sections.forEach(section => this.expandedSections[section.sectionId] ??= true);
          this.treeRevision.update(value => value + 1);
        }))
      )) : of([])),
      switchMap(() => {
        const sections = Object.values(this.sectionsMap).flat();
        return sections.length ? forkJoin(sections.map(section =>
          this.api.getPagesBySection(section.sectionId).pipe(tap(pages => {
            this.pagesMap[section.sectionId] = pages;
            this.treeRevision.update(value => value + 1);
          }))
        )) : of([]);
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe({ error: error => this.loadError.set(error.message || 'No se pudo cargar la biblioteca.') });
  }

  toggleNotebook(id: string) { this.expandedNotebooks[id] = !this.expandedNotebooks[id]; }
  toggleSection(id: string) { this.expandedSections[id] = !this.expandedSections[id]; }
  onSelectPage(page: Page, section: Section, notebook: Notebook) { this.state.selectPage(page, section, notebook); }

  addNotebook() { this.openModal('create-notebook', 'Nuevo cuaderno', 'Ej. Producto 2026', ''); }
  addSection(event: Event, notebookId: string) { event.stopPropagation(); this.openModal('create-section', 'Nueva sección', 'Ej. Investigación', '', { notebookId }); }
  addPage(event: Event, notebook: Notebook, section: Section) { event.stopPropagation(); this.openModal('create-page', 'Nueva página', 'Título de la nota', '', { notebook, section }); }
  editNotebook(event: Event, notebook: Notebook) { event.stopPropagation(); this.openModal('edit-notebook', 'Editar cuaderno', '', notebook.name, { notebook }); }
  editSection(event: Event, section: Section) { event.stopPropagation(); this.openModal('edit-section', 'Editar sección', '', section.name, { section }); }
  editPage(event: Event, page: Page) { event.stopPropagation(); this.openModal('edit-page', 'Editar página', '', page.title, { page }); }

  openModal(action: ModalAction, title: string, placeholder: string, value: string, context: any = null) {
    Object.assign(this, { modalAction: action, modalTitle: title, modalPlaceholder: placeholder, modalValue: value, modalContext: context, isModalOpen: true, actionError: '' });
  }
  closeModal() { if (!this.isActionPending) { this.isModalOpen = false; this.modalContext = null; this.actionError = ''; } }

  saveModal() {
    const value = this.modalValue.trim();
    if (!value || !this.modalAction) return;
    this.isActionPending = true;
    this.actionError = '';
    let request: Observable<any>;
    switch (this.modalAction) {
      case 'create-notebook': request = this.api.createNotebook({ userId: this.api.getMockUserId(), name: value, color: '#e55b3c', orderInUser: this.notebooks.length }); break;
      case 'create-section': request = this.api.createSection({ notebookId: this.modalContext.notebookId, name: value, color: '#5d9c91', orderInParent: this.sectionsMap[this.modalContext.notebookId]?.length || 0 }); break;
      case 'create-page': request = this.api.createPage({ sectionId: this.modalContext.section.sectionId, title: value, orderInSection: this.pagesMap[this.modalContext.section.sectionId]?.length || 0, lastModifiedByUserId: this.api.getMockUserId(), version: 1 }); break;
      case 'edit-notebook': request = this.api.updateNotebook(this.modalContext.notebook.notebookId, { name: value }); break;
      case 'edit-section': request = this.api.updateSection(this.modalContext.section.sectionId, { name: value }); break;
      case 'edit-page': request = this.api.updatePage(this.modalContext.page.pageId, { title: value, lastModifiedByUserId: this.api.getMockUserId() }); break;
    }
    request.pipe(finalize(() => this.isActionPending = false)).subscribe({
      next: (created: any) => {
        if (this.modalAction === 'create-page') this.state.selectPage(created, this.modalContext.section, this.modalContext.notebook);
        if (this.modalAction === 'edit-page') this.state.updatePage(created);
        this.isModalOpen = false;
        this.state.triggerRefresh();
      },
      error: (error: Error) => this.actionError = error.message
    });
  }

  deleteFromModal() {
    if (!this.modalAction || !confirm('Esta acción quitará el elemento de tu biblioteca. ¿Continuar?')) return;
    const request = this.modalAction === 'edit-notebook'
      ? this.api.deleteNotebook(this.modalContext.notebook.notebookId)
      : this.modalAction === 'edit-section'
        ? this.api.deleteSection(this.modalContext.section.sectionId)
        : this.api.deletePage(this.modalContext.page.pageId);
    this.isActionPending = true;
    request.pipe(finalize(() => this.isActionPending = false)).subscribe({
      next: () => { this.state.clearSelection(); this.isModalOpen = false; this.state.triggerRefresh(); },
      error: error => this.actionError = error.message
    });
  }

  onDragStart(event: DragEvent, item: Notebook | Section | Page, type: 'notebook' | 'section' | 'page') {
    this.draggedItem = item; this.draggedType = type; event.dataTransfer!.effectAllowed = 'move'; event.stopPropagation();
  }
  onDragOver(event: DragEvent) { event.preventDefault(); }
  onDrop(event: DragEvent, target: any, type: 'notebook' | 'section' | 'page') {
    event.preventDefault(); event.stopPropagation();
    if (!this.draggedItem || this.draggedItem === target || this.draggedType !== type) return;
    const list: any[] = type === 'notebook' ? this.notebooks : type === 'section' ? this.sectionsMap[target.notebookId] : this.pagesMap[target.sectionId];
    const id = type === 'notebook' ? 'notebookId' : type === 'section' ? 'sectionId' : 'pageId';
    const from = list.findIndex(item => item[id] === (this.draggedItem as any)[id]);
    const to = list.findIndex(item => item[id] === target[id]);
    if (from >= 0 && to >= 0) {
      list.splice(to, 0, list.splice(from, 1)[0]);
      const updates = list.map((item, index) => type === 'notebook'
        ? this.api.updateNotebook(item.notebookId, { orderInUser: index })
        : type === 'section'
          ? this.api.updateSection(item.sectionId, { orderInParent: index })
          : this.api.updatePage(item.pageId, { orderInSection: index, lastModifiedByUserId: this.api.getMockUserId() }));
      forkJoin(updates).pipe(catchError(() => { this.loadNotebooksTree(); return of([]); })).subscribe();
    }
    this.draggedItem = null; this.draggedType = null;
  }
}
