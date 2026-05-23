#!/bin/bash

FRONT_DIR="/home/tyrak/proyectos/gestor-notas/gestorNotasFront"

echo "🔄 Sobrescribiendo interfaces de TypeScript..."
cat << 'EOF' > "$FRONT_DIR/src/app/models/types.ts"
export interface User {
  userId: string;
  username: string;
  email: string;
}

export interface Notebook {
  notebookId: string;
  userId: string;
  name: string;
  color: string;
  isDeleted: boolean;
  orderInUser: number;
}

export interface Section {
  sectionId: string;
  notebookId: string;
  sectionGroupId?: string | null;
  name: string;
  color: string;
  isDeleted: boolean;
  orderInParent: number;
}

export interface Page {
  pageId: string;
  sectionId: string;
  parentPageId?: string | null;
  title: string;
  isDeleted: boolean;
  orderInSection: number;
  lastModifiedByUserId: string;
  version: number;
}

export interface PageContentBlock {
  contentBlockId?: string;
  pageId: string;
  type: 'text' | 'code_block' | 'table' | 'image';
  contentData: string; // Payload JSON estructurado para el campo JSONB de la BD
  orderOnPage: number;
  lastModifiedByUserId: string;
}
EOF

echo "⚡ Optimizando el ApiService con consultas filtradas relacionales..."
cat << 'EOF' > "$FRONT_DIR/src/app/services/api.service.ts"
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Notebook, Section, Page, PageContentBlock } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // ID del usuario de prueba tyrak persistido en tu BD
  getMockUserId(): string {
    return 'f1ce8d47-f208-4ab9-932b-8979840887a2';
  }

  getNotebooks(): Observable<Notebook[]> {
    return this.http.get<Notebook[]>(`${this.baseUrl}/notebooks`);
  }
  createNotebook(notebook: Partial<Notebook>): Observable<Notebook> {
    return this.http.post<Notebook>(`${this.baseUrl}/notebooks`, notebook);
  }

  getSectionsByNotebook(notebookId: string): Observable<Section[]> {
    return this.http.get<Section[]>(`${this.baseUrl}/sections/notebook/${notebookId}`);
  }
  createSection(section: Partial<Section>): Observable<Section> {
    return this.http.post<Section>(`${this.baseUrl}/sections`, section);
  }

  getPagesBySection(sectionId: string): Observable<Page[]> {
    return this.http.get<Page[]>(`${this.baseUrl}/pages/section/${sectionId}`);
  }
  createPage(page: Partial<Page>): Observable<Page> {
    return this.http.post<Page>(`${this.baseUrl}/pages`, page);
  }

  getContentBlocksByPage(pageId: string): Observable<PageContentBlock[]> {
    return this.http.get<PageContentBlock[]>(`${this.baseUrl}/pageContentBlocks/page/${pageId}`);
  }
  saveContentBlock(block: Partial<PageContentBlock>): Observable<PageContentBlock> {
    return this.http.post<PageContentBlock>(`${this.baseUrl}/pageContentBlocks`, block);
  }
}
EOF

echo "🧠 Creando el StateService Global basado en Angular Signals..."
cat << 'EOF' > "$FRONT_DIR/src/app/services/state.service.ts"
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

  triggerRefresh() {
    this.refreshTrigger.update(v => v + 1);
  }
}
EOF

echo "🌲 Reescribiendo el Sidebar con renderizado anidado dinámico..."
cat << 'EOF' > "$FRONT_DIR/src/app/components/sidebar/sidebar.component.ts"
import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { StateService } from '../../services/state.service';
import { Notebook, Section, Page } from '../../models/types';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent implements OnInit {
  notebooks: Notebook[] = [];
  sectionsMap: { [notebookId: string]: Section[] } = {};
  pagesMap: { [sectionId: string]: Page[] } = {};

  // Estado visual de qué ramas del árbol están expandidas en la UX
  expandedNotebooks: { [id: string]: boolean } = {};
  expandedSections: { [id: string]: boolean } = {};

  constructor(private api: ApiService, public state: StateService) {
    // Escuchar la señal global de refresco automático
    effect(() => {
      if (this.state.refreshTrigger() >= 0) {
        this.loadNotebooksTree();
      }
    });
  }

  ngOnInit() {
    this.loadNotebooksTree();
  }

  loadNotebooksTree() {
    this.api.getNotebooks().subscribe({
      next: (books) => {
        this.notebooks = books;
        books.forEach(b => this.loadSections(b.notebookId));
      }
    });
  }

  loadSections(notebookId: string) {
    this.api.getSectionsByNotebook(notebookId).subscribe(secs => {
      this.sectionsMap[notebookId] = secs;
      secs.forEach(s => this.loadPages(s.sectionId));
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
    const name = prompt('Nombre del nuevo Cuaderno:');
    if (!name) return;
    this.api.createNotebook({
      userId: this.api.getMockUserId(),
      name,
      color: '#4f46e5',
      orderInUser: this.notebooks.length + 1
    }).subscribe(() => this.state.triggerRefresh());
  }

  addSection(event: Event, notebookId: string) {
    event.stopPropagation();
    const name = prompt('Nombre de la nueva Sección:');
    if (!name) return;
    this.api.createSection({
      notebookId,
      name,
      color: '#ef4444',
      orderInParent: (this.sectionsMap[notebookId]?.length || 0) + 1
    }).subscribe(() => {
      this.expandedNotebooks[notebookId] = true;
      this.state.triggerRefresh();
    });
  }

  addPage(event: Event, notebook: Notebook, section: Section) {
    event.stopPropagation();
    const title = prompt('Título de la nueva Página:');
    if (!title) return;
    this.api.createPage({
      sectionId: section.sectionId,
      title,
      orderInSection: (this.pagesMap[section.sectionId]?.length || 0) + 1,
      lastModifiedByUserId: this.api.getMockUserId(),
      version: 1
    }).subscribe(newPage => {
      this.expandedSections[section.sectionId] = true;
      this.state.selectPage(newPage, section, notebook);
      this.state.triggerRefresh();
    });
  }
}
EOF

cat << 'EOF' > "$FRONT_DIR/src/app/components/sidebar/sidebar.component.html"
<div class="w-64 h-screen bg-[#fbfbfa] border-r border-slate-200 flex flex-col text-[#37352f] text-sm select-none">
  <div class="p-3 font-semibold flex items-center justify-between hover:bg-slate-200/50 cursor-pointer transition">
    <div class="flex items-center gap-2">
      <div class="w-5 h-5 bg-indigo-600 rounded text-white flex items-center justify-center font-bold text-xs">T</div>
      <span class="font-medium text-slate-700">Tyrak Workspace</span>
    </div>
  </div>

  <div class="flex items-center justify-between px-4 py-2 mt-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
    <span>Mis Cuadernos</span>
    <button (click)="addNotebook()" class="hover:bg-slate-200 p-1 rounded text-slate-600 transition" title="Agregar Cuaderno">➕</button>
  </div>

  <div class="flex-1 overflow-y-auto px-2 space-y-1">
    @for (notebook of notebooks; track notebook.notebookId) {
      <div class="space-y-0.5">
        
        <div (click)="toggleNotebook(notebook.notebookId)" 
             class="flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-200/60 cursor-pointer font-medium text-slate-700 transition group">
          <div class="flex items-center gap-2 truncate">
            <span>{{ expandedNotebooks[notebook.notebookId] ? '▼' : '▶' }}</span>
            <span [style.color]="notebook.color">📘</span>
            <span class="truncate">{{ notebook.name }}</span>
          </div>
          <button (click)="addSection($event, notebook.notebookId)" 
                  class="opacity-0 group-hover:opacity-100 text-xs bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 hover:bg-slate-300 transition">
            + Sec
          </button>
        </div>

        @if (expandedNotebooks[notebook.notebookId]) {
          <div class="pl-4 border-l border-slate-200/70 ml-3.5 space-y-0.5">
            @for (section of sectionsMap[notebook.notebookId]; track section.sectionId) {
              <div>
                <div (click)="toggleSection(section.sectionId)"
                     class="flex items-center justify-between px-2 py-1 rounded hover:bg-slate-200/60 cursor-pointer text-xs font-medium text-slate-600 transition group">
                  <div class="flex items-center gap-1.5 truncate">
                    <span>{{ expandedSections[section.sectionId] ? '▼' : '▶' }}</span>
                    <span [style.color]="section.color">🔸</span>
                    <span class="truncate">{{ section.name }}</span>
                  </div>
                  <button (click)="addPage($event, notebook, section)"
                          class="opacity-0 group-hover:opacity-100 text-[10px] bg-slate-200 px-1 py-0.5 rounded text-slate-500 hover:bg-slate-300 transition">
                    + Pág
                  </button>
                </div>

                @if (expandedSections[section.sectionId]) {
                  <div class="pl-4 border-l border-dashed border-slate-200 ml-2.5 space-y-0.5">
                    @for (page of pagesMap[section.sectionId]; track page.pageId) {
                      <div (click)="onSelectPage(page, section, notebook)"
                           [class.bg-indigo-50]="state.selectedPage()?.pageId === page.pageId"
                           [class.text-indigo-600]="state.selectedPage()?.pageId === page.pageId"
                           class="flex items-center gap-2 px-2 py-1 text-xs rounded hover:bg-[#efefe9] cursor-pointer transition truncate">
                        <span>📄</span>
                        <span class="truncate font-normal">{{ page.title || 'Sin título' }}</span>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }

      </div>
    }
  </div>
</div>
EOF

echo "✍️ Configurando el Canvas del Editor con Auto-Guardado en JSONB..."
cat << 'EOF' > "$FRONT_DIR/src/app/components/page-editor/page-editor.component.ts"
import { Component, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StateService } from '../../services/state.service';
import { ApiService } from '../../services/api.service';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-page-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './page-editor.component.html'
})
export class PageEditorComponent {
  editorText: string = '';
  isSaving: boolean = false;
  
  // Debouncer reactivo de RxJS para retrasar la persistencia de escritura
  private saveSubject = new Subject<string>();

  constructor(public state: StateService, private api: ApiService) {
    // Detectar reactivamente cuándo cambia la página seleccionada en el árbol
    effect(() => {
      const activePage = this.state.selectedPage();
      if (activePage) {
        this.loadCurrentPageContent(activePage.pageId);
      }
    });

    // Escuchar el flujo de escritura con debounce para resguardar los hilos del servidor
    this.saveSubject.pipe(
      debounceTime(700) // Espera 700ms de inactividad de teclado
    ).subscribe(text => {
      this.persistContentToPostgres(text);
    });
  }

  loadCurrentPageContent(pageId: string) {
    this.api.getContentBlocksByPage(pageId).subscribe({
      next: (blocks) => {
        const textBlock = blocks.find(b => b.type === 'text');
        if (textBlock) {
          try {
            // Desempaquetamos los atributos dinámicos guardados en la columna JSONB
            const doc = JSON.parse(textBlock.contentData);
            this.editorText = doc.text || '';
          } catch {
            this.editorText = textBlock.contentData;
          }
        } else {
          this.editorText = '';
        }
      },
      error: () => this.editorText = ''
    });
  }

  onTextareaChange() {
    this.isSaving = true;
    this.saveSubject.next(this.editorText);
  }

  persistContentToPostgres(text: string) {
    const page = this.state.selectedPage();
    if (!page) return;

    // Estructuramos el payload libre en formato String JSON para que PostgreSQL lo almacene nativamente como JSONB
    const jsonbPayload = JSON.stringify({
      text: text,
      charactersCount: text.length,
      device: '7yrak-server-linux'
    });

    this.api.saveContentBlock({
      pageId: page.pageId,
      type: 'text',
      contentData: jsonbPayload,
      orderOnPage: 1,
      lastModifiedByUserId: this.api.getMockUserId()
    }).subscribe({
      next: () => this.isSaving = false,
      error: () => this.isSaving = false
    });
  }
}
EOF

cat << 'EOF' > "$FRONT_DIR/src/app/components/page-editor/page-editor.component.html"
<div class="flex-1 h-screen bg-white overflow-y-auto flex justify-center">
  @if (state.selectedPage(); as page) {
    <div class="max-w-3xl w-full px-16 py-12 flex flex-col space-y-6 animate-fade-in">
      
      <div class="text-xs text-slate-400 flex items-center gap-1.5 font-medium tracking-wide">
        <span>📘 {{ state.selectedNotebook()?.name }}</span>
        <span class="text-slate-300">/</span>
        <span>🔸 {{ state.selectedSection()?.name }}</span>
        <span class="text-slate-300">/</span>
        <span class="text-slate-600 font-semibold">📄 {{ page.title }}</span>
      </div>

      <h1 class="text-4xl font-bold text-slate-800 focus:outline-none border-none tracking-tight py-1">
        {{ page.title }}
      </h1>

      <div class="flex flex-col flex-1 pt-2">
        <div class="flex justify-between items-center mb-2">
          <label class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lienzo de Contenido (JSONB Real-Time)</label>
          
          @if (isSaving) {
            <span class="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded animate-pulse border border-amber-200">
              ⚡ Sincronizando en Postgres...
            </span>
          } @else {
            <span class="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              ✓ Guardado en BD
            </span>
          }
        </div>

        <textarea 
          [(ngModel)]="editorText"
          (ngModelChange)="onTextareaChange()"
          placeholder="Escribe tus notas de desarrollo aquí... Al dejar de escribir, Angular llamará de inmediato a tu API Spring Boot para persistir de forma híbrida en tu motor relacional." 
          class="w-full flex-1 p-5 bg-slate-50/50 rounded-2xl border border-slate-200 focus:outline-none focus:border-slate-300 focus:bg-white text-slate-700 leading-relaxed text-sm resize-none shadow-inner transition-all duration-200"
        ></textarea>
      </div>

    </div>
  } @else {
    <div class="flex flex-col items-center justify-center text-slate-400 space-y-3 select-none">
      <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-2xl shadow-sm">🗒️</div>
      <div class="text-center">
        <p class="font-medium text-slate-700 text-sm">Tu espacio de trabajo está listo</p>
        <p class="text-xs text-slate-400 mt-1">Selecciona una página existente o crea una nueva utilizando los botones <span class="font-bold text-slate-500">+ Pág</span> del menú lateral.</p>
      </div>
    </div>
  }
</div>
EOF

echo "--------------------------------------------------------"
echo "  ¡Lógica Interactiva Inyectada Exitosamente en Angular!"
echo "--------------------------------------------------------"
