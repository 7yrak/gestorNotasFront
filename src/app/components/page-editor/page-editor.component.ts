import { Component, effect, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
  template: `
    <div *ngIf="state.selectedPage() as page; else noPage" class="flex flex-col h-screen w-full bg-white dark:bg-gray-900 transition-colors duration-300">
      <!-- Encabezado (Breadcrumbs y Estado) -->
      <header class="flex items-center justify-between px-8 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
        <div class="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <span class="font-medium text-indigo-600 dark:text-indigo-400">{{ state.selectedNotebook()?.name }}</span>
          <span class="mx-2 text-gray-300 dark:text-gray-600">/</span>
          <span class="font-medium">{{ state.selectedSection()?.name }}</span>
          <span class="mx-2 text-gray-300 dark:text-gray-600">/</span>
          <span class="font-bold text-gray-800 dark:text-gray-100 text-lg ml-2">{{ page.title }}</span>
        </div>
        <div class="flex items-center h-6">
          <span *ngIf="isSaving" class="text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1 rounded-full animate-pulse flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            Guardando...
          </span>
          <span *ngIf="!isSaving && editorText" class="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1 rounded-full flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            Guardado
          </span>
        </div>
      </header>

      <!-- Barra de herramientas (Rich Text) -->
      <div class="flex items-center gap-1 px-8 py-2 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <button (click)="execCmd('bold')" class="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold transition-colors" title="Negrita">B</button>
        <button (click)="execCmd('italic')" class="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 italic transition-colors" title="Cursiva">I</button>
        <button (click)="execCmd('underline')" class="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 underline transition-colors" title="Subrayado">U</button>
        <div class="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-2"></div>
        <button (click)="execCmd('formatBlock', 'H1')" class="px-3 py-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-sm transition-colors" title="Título principal">H1</button>
        <button (click)="execCmd('formatBlock', 'H2')" class="px-3 py-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-sm transition-colors" title="Subtítulo">H2</button>
        <div class="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-2"></div>
        <button (click)="execCmd('insertUnorderedList')" class="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center gap-1 transition-colors" title="Lista de viñetas">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>

      <!-- Lienzo del Editor -->
      <div class="flex-1 overflow-y-auto px-12 py-10 flex justify-center bg-gray-50/20 dark:bg-gray-900 custom-scrollbar">
        <div class="max-w-4xl w-full">
          <div
            #editorRef
            contenteditable="true"
            class="min-h-full outline-none text-gray-800 dark:text-gray-200 leading-relaxed text-lg pb-32 editor-canvas"
            (input)="onEditorInput()"
            placeholder="Comienza a escribir tus notas aquí... (Presiona Enter para una nueva línea)"
          ></div>
        </div>
      </div>
    </div>

    <!-- Estado Vacío -->
    <ng-template #noPage>
      <div class="flex-1 h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 text-gray-400 select-none transition-colors duration-300">
        <div class="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-3xl flex items-center justify-center text-5xl mb-6 shadow-sm border border-gray-100 dark:border-gray-800">
          📝
        </div>
        <h2 class="font-medium text-gray-600 dark:text-gray-300 text-xl mb-2">Tu espacio de trabajo está listo</h2>
        <p class="text-gray-400 dark:text-gray-500 max-w-sm text-center text-sm">Selecciona una página existente o crea una nueva desde el menú lateral para comenzar a documentar.</p>
      </div>
    </ng-template>
  `,
  styles: [`
    .editor-canvas[contenteditable]:empty::before {
      content: attr(placeholder);
      color: #9ca3af;
      pointer-events: none;
      display: block;
      font-style: italic;
    }
    .editor-canvas *:focus { outline: none; }
    
    /* Estilos enriquecidos globales para el contenido inyectado por execCommand */
    ::ng-deep .editor-canvas h1 { font-size: 2.25rem; font-weight: 800; margin-top: 1.5rem; margin-bottom: 1rem; line-height: 1.2; color: inherit; }
    ::ng-deep .editor-canvas h2 { font-size: 1.75rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; color: inherit; }
    ::ng-deep .editor-canvas p { margin-bottom: 0.75rem; min-height: 1.5rem; }
    ::ng-deep .editor-canvas ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
    ::ng-deep .editor-canvas ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1rem; }
    ::ng-deep .editor-canvas b, ::ng-deep .editor-canvas strong { font-weight: 700; color: inherit; }
    ::ng-deep .editor-canvas i, ::ng-deep .editor-canvas em { font-style: italic; }
    ::ng-deep .editor-canvas u { text-decoration: underline; text-underline-offset: 4px; }
  `]
})
export class PageEditorComponent {
  editorText: string = '';
  isSaving: boolean = false;
  
  @ViewChild('editorRef') editorRef!: ElementRef<HTMLDivElement>;

  // Debouncer reactivo de RxJS para retrasar la persistencia de escritura
  private saveSubject = new Subject<string>();
  private currentBlock: any = null; // Referencia al bloque existente para hacer UPDATE

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
      debounceTime(700)
    ).subscribe(text => {
      this.persistContentToPostgres(text);
    });
  }

  loadCurrentPageContent(pageId: string) {
    this.api.getContentBlocksByPage(pageId).subscribe({
      next: (blocks) => {
        // Usamos slice().reverse() por si hay duplicados antiguos en la BD debido al bug previo, toma el más reciente
        const textBlock = blocks.slice().reverse().find(b => b.type === 'text');
        let newHtml = '';
        if (textBlock) {
          this.currentBlock = textBlock;
          try {
            const doc = JSON.parse(textBlock.contentData);
            newHtml = doc.html || doc.text || '';
          } catch {
            newHtml = textBlock.contentData;
          }
        } else {
          this.currentBlock = null;
        }
        this.editorText = newHtml;
        if (this.editorRef) {
          this.editorRef.nativeElement.innerHTML = newHtml;
        }
      },
      error: () => {
        this.currentBlock = null;
        this.editorText = '';
        if (this.editorRef) this.editorRef.nativeElement.innerHTML = '';
      }
    });
  }

  onEditorInput() {
    this.isSaving = true;
    if (this.editorRef) {
      this.editorText = this.editorRef.nativeElement.innerHTML;
      this.saveSubject.next(this.editorText);
    }
  }

  execCmd(command: string, value: string = '') {
    document.execCommand(command, false, value);
    if (this.editorRef) {
      this.editorRef.nativeElement.focus();
    }
    this.onEditorInput(); // Dispara el guardado
  }

  persistContentToPostgres(htmlContent: string) {
    const page = this.state.selectedPage();
    if (!page) return;

    // Estructuramos el payload libre en formato String JSON
    const jsonbPayload = JSON.stringify({
      html: htmlContent,
      text: this.editorRef?.nativeElement.innerText || '',
      charactersCount: htmlContent.length,
      device: 'web-client'
    });

    const payload = {
      ...(this.currentBlock || {}), // Propaga el ID si ya existía para hacer un UPDATE en la base de datos
      pageId: page.pageId,
      type: 'text',
      contentData: jsonbPayload,
      orderOnPage: 1,
      lastModifiedByUserId: this.api.getMockUserId()
    };

    this.api.saveContentBlock(payload).subscribe({
      next: (savedBlock) => {
        this.isSaving = false;
        this.currentBlock = savedBlock; // Guardamos la referencia actualizada (con ID asegurado)
      },
      error: () => this.isSaving = false
    });
  }
}
