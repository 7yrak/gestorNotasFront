import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, ViewChild, effect, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Highlight from '@tiptap/extension-highlight';
import { BulletList, OrderedList } from '@tiptap/extension-list';
import { TextStyleKit } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { TableKit } from '@tiptap/extension-table';
import { Subject, of, timer } from 'rxjs';
import { catchError, concatMap, debounce, debounceTime, finalize, map, switchMap, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { StateService } from '../../services/state.service';

interface SavePayload { pageId: string; html: string; text: string; immediate?: boolean; }

type BulletListStyle = 'disc' | 'circle' | 'square';
type OrderedListStyle = '1' | 'A' | 'a' | 'I' | 'i';

const bulletListStyles: Array<{ value: BulletListStyle; label: string }> = [
  { value: 'disc', label: '• Disco' },
  { value: 'circle', label: '○ Círculo' },
  { value: 'square', label: '■ Cuadro' }
];

const orderedListStyles: Array<{ value: OrderedListStyle; label: string }> = [
  { value: '1', label: '1, 2, 3' },
  { value: 'A', label: 'A, B, C' },
  { value: 'a', label: 'a, b, c' },
  { value: 'I', label: 'I, II, III' },
  { value: 'i', label: 'i, ii, iii' }
];

const StyledBulletList = BulletList.extend({
  addAttributes() {
    return {
      listStyleType: {
        default: 'disc',
        parseHTML: element => {
          const style = element.style.listStyleType || element.getAttribute('data-list-style-type');
          return style === 'circle' || style === 'square' || style === 'disc' ? style : 'disc';
        },
        renderHTML: attributes => ({
          'data-list-style-type': attributes['listStyleType'],
          style: `list-style-type: ${attributes['listStyleType'] || 'disc'};`
        })
      }
    };
  }
});

@Component({
  selector: 'app-page-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="workspace" *ngIf="state.selectedPage() as page; else welcome">
      <header class="topbar">
        <button class="menu-button" type="button" (click)="state.toggleSidebar()" aria-label="Abrir biblioteca">
          <span></span><span></span><span></span>
        </button>
        <nav aria-label="Ruta de la página">
          <span>{{ state.selectedNotebook()?.name }}</span><b>/</b><span>{{ state.selectedSection()?.name }}</span>
        </nav>
        <div class="sync-state" [attr.data-status]="saveStatus()">
          <i></i><span>{{ saveLabel }}</span>
        </div>
      </header>

      <div class="toolbar-shell">
        <div class="toolbar" role="toolbar" aria-label="Formato de texto">
          <div class="tool-group">
            <button type="button" (click)="run('undo')" [disabled]="!canRun('undo')" title="Deshacer (Ctrl+Z)">↶</button>
            <button type="button" (click)="run('redo')" [disabled]="!canRun('redo')" title="Rehacer">↷</button>
          </div>
          <div class="tool-group format-select">
            <select [value]="currentBlock" (change)="setBlock($any($event.target).value)" aria-label="Estilo de párrafo">
              <option value="paragraph">Texto</option><option value="heading-1">Título 1</option><option value="heading-2">Título 2</option><option value="heading-3">Título 3</option><option value="blockquote">Cita</option>
            </select>
          </div>
          <div class="tool-group format-select font-family-select">
            <select [value]="currentFontFamily" (change)="setFontFamily($any($event.target).value)" aria-label="Fuente">
              <option value="">Fuente</option><option value="Arial">Arial</option><option value="Georgia">Georgia</option><option value="'Trebuchet MS'">Trebuchet</option><option value="'Courier New'">Courier</option>
            </select>
          </div>
          <div class="tool-group format-select font-size-select">
            <select [value]="currentFontSize" (change)="setFontSize($any($event.target).value)" aria-label="Tamaño de fuente">
              <option value="">Tamaño</option><option value="12px">12</option><option value="14px">14</option><option value="16px">16</option><option value="18px">18</option><option value="24px">24</option><option value="32px">32</option><option value="48px">48</option>
            </select>
          </div>
          <div class="tool-group">
            <button type="button" (click)="run('bold')" [class.active]="active('bold')" title="Negrita"><strong>B</strong></button>
            <button type="button" (click)="run('italic')" [class.active]="active('italic')" title="Cursiva"><em>I</em></button>
            <button type="button" (click)="run('underline')" [class.active]="active('underline')" title="Subrayado"><u>U</u></button>
            <button type="button" (click)="run('strike')" [class.active]="active('strike')" title="Tachado"><s>S</s></button>
            <label class="color-tool" title="Color del texto"><span>A</span><input type="color" [value]="currentColor" (input)="setColor($any($event.target).value)" aria-label="Color del texto"></label>
            <label class="color-tool highlight-tool" title="Color de resaltado"><span>▰</span><input type="color" [value]="currentHighlight" (input)="setHighlight($any($event.target).value)" aria-label="Color de resaltado"></label>
            <button type="button" (click)="clearFormatting()" title="Borrar formato">Tx</button>
          </div>
          <div class="tool-group">
            <button type="button" (click)="run('bulletList')" [class.active]="active('bulletList')" title="Lista con viñetas">•≡</button>
            <select class="list-style-select" [value]="currentBulletListStyle" (change)="setBulletListStyle($any($event.target).value)" aria-label="Tipo de viñeta" title="Tipo de viñeta">
              <option *ngFor="let option of bulletListStyles" [value]="option.value">{{ option.label }}</option>
            </select>
            <button type="button" (click)="run('orderedList')" [class.active]="active('orderedList')" title="Lista numerada">1≡</button>
            <select class="list-style-select ordered-style-select" [value]="currentOrderedListStyle" (change)="setOrderedListStyle($any($event.target).value)" aria-label="Tipo de numeración" title="Tipo de numeración">
              <option *ngFor="let option of orderedListStyles" [value]="option.value">{{ option.label }}</option>
            </select>
            <button type="button" (click)="run('taskList')" [class.active]="active('taskList')" title="Lista de tareas">☑</button>
          </div>
          <div class="tool-group">
            <button type="button" (click)="setAlign('left')" [class.active]="active({ textAlign: 'left' })" title="Alinear izquierda">≡</button>
            <button type="button" (click)="setAlign('center')" [class.active]="active({ textAlign: 'center' })" title="Centrar">≣</button>
            <button type="button" (click)="setAlign('right')" [class.active]="active({ textAlign: 'right' })" title="Alinear derecha">≡</button>
            <button type="button" (click)="outdent()" [disabled]="!canOutdent" title="Disminuir sangría">⇤</button>
            <button type="button" (click)="indent()" [disabled]="!canIndent" title="Aumentar sangría">⇥</button>
          </div>
          <div class="tool-group">
            <button type="button" (click)="setLink()" [class.active]="active('link')" title="Insertar enlace">↗</button>
            <button type="button" (click)="imageInput.click()" title="Insertar imagen desde el dispositivo">▧</button>
            <button type="button" (click)="addImageFromUrl()" title="Insertar imagen desde una dirección web">🌐</button>
            <button type="button" (click)="addTable()" title="Insertar tabla">▦</button>
            <button type="button" (click)="run('codeBlock')" [class.active]="active('codeBlock')" title="Bloque de código">&lt;/&gt;</button>
            <button type="button" (click)="run('horizontalRule')" title="Separador">―</button>
          </div>
          <div class="tool-group table-tools" *ngIf="active('table')" aria-label="Editar tabla">
            <button type="button" (click)="tableCommand('addColumnAfter')" title="Agregar columna">+Col</button>
            <button type="button" (click)="tableCommand('deleteColumn')" title="Eliminar columna">−Col</button>
            <button type="button" (click)="tableCommand('addRowAfter')" title="Agregar fila">+Fila</button>
            <button type="button" (click)="tableCommand('deleteRow')" title="Eliminar fila">−Fila</button>
            <button type="button" (click)="tableCommand('mergeOrSplit')" title="Combinar o dividir celdas">Celdas</button>
            <button type="button" class="danger-tool" (click)="tableCommand('deleteTable')" title="Eliminar tabla">× Tabla</button>
          </div>
        </div>
        <input #imageInput class="visually-hidden" type="file" accept="image/png,image/jpeg,image/webp,image/gif" (change)="addImageFile($event)">
      </div>

      <main class="document-scroll" [style.--page-color]="page.color || state.selectedSection()?.color || '#e55b3c'">
        <article class="paper" [class.loading]="isLoading()">
          <div class="paper-rule"></div>
          <div class="title-area">
            <span class="page-kicker">Nota / {{ state.selectedSection()?.name }}</span>
            <textarea
              [ngModel]="page.title"
              (ngModelChange)="onTitleChange($event)"
              rows="1" maxlength="255"
              aria-label="Título de la página"
              placeholder="Página sin título"
            ></textarea>
            <div class="page-meta"><span>{{ words }} palabras</span><span>{{ characters }} caracteres</span><span>Versión {{ page.version || 1 }}</span></div>
          </div>
          <div #editorHost class="editor-host"></div>
          <div *ngIf="isLoading()" class="loading-document"><span></span><span></span><span></span></div>
          <p *ngIf="loadError()" class="document-error">{{ loadError() }} <button type="button" (click)="loadPage(page.pageId)">Reintentar</button></p>
        </article>
      </main>

      <footer class="statusbar">
        <span><kbd>Ctrl</kbd> + <kbd>K</kbd> enlace</span>
        <span>Guardado automático</span>
      </footer>
    </div>

    <ng-template #welcome>
      <div class="welcome">
        <button class="menu-button welcome-menu" type="button" (click)="state.toggleSidebar()" aria-label="Abrir biblioteca"><span></span><span></span><span></span></button>
        <div class="welcome-art"><div class="sheet back"></div><div class="sheet front"><i></i><i></i><i></i><b>+</b></div></div>
        <span class="welcome-kicker">Espacio en blanco</span>
        <h1>Una idea merece<br><em>un buen margen.</em></h1>
        <p>Selecciona una página de tu biblioteca o crea una nueva para empezar a escribir.</p>
      </div>
    </ng-template>
  `,
  styleUrls: ['./page-editor.component.css']
})
export class PageEditorComponent implements OnDestroy {
  @ViewChild('editorHost')
  set editorHost(host: ElementRef<HTMLDivElement> | undefined) {
    if (!host) {
      this.editor?.destroy();
      this.editor = undefined;
      this.requestedPageId = '';
      return;
    }
    if (this.editor) return;
    this.initializeEditor(host.nativeElement);
  }

  editor?: Editor;
  saveStatus = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');
  isLoading = signal(false);
  loadError = signal('');
  toolbarRevision = signal(0);
  words = 0;
  characters = 0;
  readonly bulletListStyles = bulletListStyles;
  readonly orderedListStyles = orderedListStyles;
  private requestedPageId = '';
  private readonly saveSubject = new Subject<SavePayload>();
  private readonly titleSubject = new Subject<{ pageId: string; title: string; revision: number }>();
  private readonly destroy$ = new Subject<void>();
  private titleRevision = 0;
  private saveNextUpdateImmediately = false;

  constructor(public state: StateService, private api: ApiService) {
    effect(() => {
      const pageId = this.state.selectedPage()?.pageId;
      if (pageId && pageId !== this.requestedPageId) this.loadPage(pageId);
    });

    this.saveSubject.pipe(
      debounce(payload => timer(payload.immediate ? 0 : 400)),
      concatMap(payload => {
        this.saveStatus.set('saving');
        return this.api.savePrimaryContent(payload.pageId, {
          pageId: payload.pageId,
          type: 'text',
          contentData: JSON.stringify({ html: payload.html, text: payload.text, schemaVersion: 2, updatedFrom: 'web' }),
          orderOnPage: 0,
          lastModifiedByUserId: this.api.getMockUserId()
        }).pipe(
          catchError(() => { this.saveStatus.set('error'); return of(null); })
        );
      }),
      takeUntil(this.destroy$)
    ).subscribe(result => { if (result) this.saveStatus.set('saved'); });

    this.titleSubject.pipe(
      debounceTime(500),
      switchMap(payload => this.api.updatePage(payload.pageId, {
        title: payload.title,
        lastModifiedByUserId: this.api.getMockUserId()
      }).pipe(
        map(updated => ({ updated, payload })),
        catchError(() => of({ updated: null, payload }))
      )),
      takeUntil(this.destroy$)
    ).subscribe(({ updated, payload }) => {
      if (payload.revision !== this.titleRevision || this.state.selectedPage()?.pageId !== payload.pageId) return;
      if (!updated) { this.saveStatus.set('error'); return; }
      this.state.updatePage(updated);
      this.saveStatus.set('saved');
    });
  }

  private initializeEditor(element: HTMLDivElement) {
    this.editor = new Editor({
      element,
      extensions: [
        StarterKit.configure({
          bulletList: false,
          orderedList: false,
          link: { openOnClick: false, autolink: true }
        }),
        StyledBulletList.configure({ keepMarks: true, keepAttributes: true }),
        OrderedList.configure({ keepMarks: true, keepAttributes: true }),
        Image.configure({
          allowBase64: true,
          inline: false,
          resize: { enabled: true, directions: ['top-left', 'top-right', 'bottom-left', 'bottom-right'], minWidth: 80, minHeight: 50, alwaysPreserveAspectRatio: true }
        }),
        Highlight.configure({ multicolor: true }),
        TextStyleKit,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Placeholder.configure({ placeholder: 'Empieza a escribir. Usa “/” para pensar en bloques, o simplemente deja fluir la idea…' }),
        TaskList,
        TaskItem.configure({ nested: true }),
        TableKit.configure({ table: { resizable: true } })
      ],
      editorProps: {
        attributes: { class: 'note-editor', spellcheck: 'true', 'aria-label': 'Contenido de la nota' },
        handleKeyDown: (_view, event) => {
          if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
            event.preventDefault();
            this.setLink();
            return true;
          }
          if (event.key === 'Tab' && this.isInsideList()) {
            event.preventDefault();
            event.shiftKey ? this.outdent() : this.indent();
            return true;
          }
          if (event.key === 'Enter') this.saveNextUpdateImmediately = true;
          return false;
        }
      },
      onUpdate: ({ editor }) => {
        this.updateMetrics();
        const pageId = this.state.selectedPage()?.pageId;
        if (pageId && !this.isLoading()) {
          const immediate = this.saveNextUpdateImmediately;
          this.saveNextUpdateImmediately = false;
          this.saveStatus.set('saving');
          this.saveSubject.next({ pageId, html: editor.getHTML(), text: editor.getText(), immediate });
        }
      },
      onSelectionUpdate: () => this.refreshToolbar(),
      onTransaction: () => this.refreshToolbar(),
      onFocus: () => this.refreshToolbar()
    });
    const pageId = this.state.selectedPage()?.pageId;
    if (pageId) this.loadPage(pageId, true);
  }

  get saveLabel() {
    return { idle: 'Sin cambios', saving: 'Guardando…', saved: 'Todo guardado', error: 'Error al guardar' }[this.saveStatus()];
  }
  get currentBlock() {
    if (this.active('heading', { level: 1 })) return 'heading-1';
    if (this.active('heading', { level: 2 })) return 'heading-2';
    if (this.active('heading', { level: 3 })) return 'heading-3';
    if (this.active('blockquote')) return 'blockquote';
    return 'paragraph';
  }
  get currentFontFamily() { this.toolbarRevision(); return this.editor?.getAttributes('textStyle')['fontFamily'] || ''; }
  get currentFontSize() { this.toolbarRevision(); return this.editor?.getAttributes('textStyle')['fontSize'] || ''; }
  get currentColor() { this.toolbarRevision(); return this.editor?.getAttributes('textStyle')['color'] || '#143c43'; }
  get currentHighlight() { this.toolbarRevision(); return this.editor?.getAttributes('highlight')['color'] || '#f6d88b'; }
  get currentBulletListStyle(): BulletListStyle {
    this.toolbarRevision();
    const value = this.editor?.getAttributes('bulletList')['listStyleType'];
    return value === 'circle' || value === 'square' || value === 'disc' ? value : 'disc';
  }
  get currentOrderedListStyle(): OrderedListStyle {
    this.toolbarRevision();
    const value = this.editor?.getAttributes('orderedList')['type'];
    return value === 'A' || value === 'a' || value === 'I' || value === 'i' || value === '1' ? value : '1';
  }

  loadPage(pageId: string, force = false) {
    if (!this.editor) { this.requestedPageId = ''; return; }
    if (!force && pageId === this.requestedPageId) return;
    this.requestedPageId = pageId;
    this.isLoading.set(true);
    this.loadError.set('');
    this.saveStatus.set('idle');
    this.editor.setEditable(false);
    this.api.getContentBlocksByPage(pageId).pipe(finalize(() => {
      if (this.requestedPageId === pageId) {
        this.isLoading.set(false);
        this.editor?.setEditable(true);
      }
    })).subscribe({
      next: blocks => {
        if (this.requestedPageId !== pageId || !this.editor) return;
        const block = blocks.find(item => item.type === 'text');
        let html = '';
        if (block) {
          try { const parsed = JSON.parse(block.contentData); html = parsed.html || parsed.text || ''; }
          catch { html = block.contentData || ''; }
        }
        this.editor.commands.setContent(html, { emitUpdate: false });
        this.updateMetrics();
        this.saveStatus.set(block ? 'saved' : 'idle');
      },
      error: error => {
        if (this.requestedPageId === pageId) this.loadError.set(error.message || 'No se pudo abrir esta nota.');
      }
    });
  }

  active(nameOrAttrs: string | Record<string, unknown>, attrs: Record<string, unknown> = {}) {
    this.toolbarRevision();
    if (!this.editor) return false;
    return typeof nameOrAttrs === 'string' ? this.editor.isActive(nameOrAttrs, attrs) : this.editor.isActive(nameOrAttrs);
  }

  canRun(command: 'undo' | 'redo') {
    this.toolbarRevision();
    if (!this.editor) return false;
    return command === 'undo' ? this.editor.can().undo() : this.editor.can().redo();
  }

  run(command: string) {
    if (!this.editor) return;
    const chain: any = this.editor.chain().focus();
    const actions: Record<string, () => void> = {
      undo: () => chain.undo().run(), redo: () => chain.redo().run(), bold: () => chain.toggleBold().run(),
      italic: () => chain.toggleItalic().run(), underline: () => chain.toggleUnderline().run(), strike: () => chain.toggleStrike().run(),
      bulletList: () => chain.toggleBulletList().run(),
      orderedList: () => chain.toggleOrderedList().run(), taskList: () => chain.toggleTaskList().run(),
      codeBlock: () => chain.toggleCodeBlock().run(), horizontalRule: () => chain.setHorizontalRule().run()
    };
    actions[command]?.();
  }

  setBlock(value: string) {
    if (!this.editor) return;
    const chain = this.editor.chain().focus();
    if (value === 'paragraph') chain.setParagraph().run();
    else if (value === 'blockquote') chain.toggleBlockquote().run();
    else chain.toggleHeading({ level: Number(value.at(-1)) as 1 | 2 | 3 }).run();
  }
  setAlign(alignment: 'left' | 'center' | 'right') { this.editor?.chain().focus().setTextAlign(alignment).run(); }
  setColor(color: string) { this.editor?.chain().focus().setColor(color).run(); }
  setHighlight(color: string) { this.editor?.chain().focus().toggleHighlight({ color }).run(); }
  setBulletListStyle(style: BulletListStyle) {
    if (!this.editor) return;
    const chain = this.editor.chain().focus();
    if (!this.active('bulletList')) chain.toggleBulletList();
    chain.updateAttributes('bulletList', { listStyleType: style }).run();
  }
  setOrderedListStyle(type: OrderedListStyle) {
    if (!this.editor) return;
    const chain = this.editor.chain().focus();
    if (!this.active('orderedList')) chain.toggleOrderedList();
    chain.updateAttributes('orderedList', { type }).run();
  }
  setFontFamily(fontFamily: string) {
    const chain = this.editor?.chain().focus();
    if (!chain) return;
    fontFamily ? chain.setFontFamily(fontFamily).run() : chain.unsetFontFamily().run();
  }
  setFontSize(fontSize: string) {
    const chain = this.editor?.chain().focus();
    if (!chain) return;
    fontSize ? chain.setFontSize(fontSize).run() : chain.unsetFontSize().run();
  }
  clearFormatting() { this.editor?.chain().focus().unsetAllMarks().clearNodes().run(); }

  private isInsideList() {
    return this.active('listItem') || this.active('taskItem');
  }

  get canIndent() {
    this.toolbarRevision();
    if (!this.editor) return false;
    const item = this.active('taskItem') ? 'taskItem' : 'listItem';
    return (this.active('taskItem') || this.active('listItem')) && this.editor.can().sinkListItem(item);
  }
  get canOutdent() {
    this.toolbarRevision();
    if (!this.editor) return false;
    const item = this.active('taskItem') ? 'taskItem' : 'listItem';
    return (this.active('taskItem') || this.active('listItem')) && this.editor.can().liftListItem(item);
  }
  indent() {
    if (!this.editor) return;
    this.editor.chain().focus().sinkListItem(this.active('taskItem') ? 'taskItem' : 'listItem').run();
  }
  outdent() {
    if (!this.editor) return;
    this.editor.chain().focus().liftListItem(this.active('taskItem') ? 'taskItem' : 'listItem').run();
  }

  setLink() {
    if (!this.editor) return;
    const previous = this.editor.getAttributes('link')['href'] || '';
    const raw = prompt('Dirección del enlace', previous);
    if (raw === null) return;
    if (!raw.trim()) { this.editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    const href = this.safeUrl(raw);
    if (!href) { alert('Usa una dirección http(s) o mailto válida.'); return; }
    this.editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
  }
  addImageFromUrl() {
    const raw = prompt('Dirección pública de la imagen (https://)');
    const src = raw ? this.safeUrl(raw, false) : null;
    if (src) this.editor?.chain().focus().setImage({ src }).run();
    else if (raw) alert('La imagen debe usar una dirección http(s) válida.');
  }
  addImageFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Selecciona un archivo de imagen válido.'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('La imagen no puede superar los 5 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') this.editor?.chain().focus().setImage({ src: reader.result, alt: file.name }).run();
    };
    reader.onerror = () => alert('No fue posible leer la imagen.');
    reader.readAsDataURL(file);
  }
  addTable() { this.editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); }
  tableCommand(command: 'addColumnAfter' | 'deleteColumn' | 'addRowAfter' | 'deleteRow' | 'mergeOrSplit' | 'deleteTable') {
    if (!this.editor) return;
    const chain: any = this.editor.chain().focus();
    chain[command]().run();
  }

  private refreshToolbar() { this.toolbarRevision.update(value => value + 1); }

  onTitleChange(title: string) {
    const page = this.state.selectedPage();
    if (!page) return;
    const draft = { ...page, title };
    this.state.updatePage(draft);
    const normalizedTitle = title.trim();
    const revision = ++this.titleRevision;
    if (!normalizedTitle) {
      this.saveStatus.set('idle');
      return;
    }
    this.saveStatus.set('saving');
    this.titleSubject.next({ pageId: page.pageId, title: normalizedTitle, revision });
  }

  private safeUrl(raw: string, allowMail = true) {
    try {
      const value = raw.includes('://') || raw.startsWith('mailto:') ? raw : `https://${raw}`;
      const url = new URL(value);
      return url.protocol === 'https:' || url.protocol === 'http:' || (allowMail && url.protocol === 'mailto:') ? url.href : null;
    } catch { return null; }
  }
  private updateMetrics() {
    const text = this.editor?.getText().trim() || '';
    this.characters = text.length;
    this.words = text ? text.split(/\s+/).length : 0;
  }

  ngOnDestroy() {
    this.destroy$.next(); this.destroy$.complete(); this.saveSubject.complete(); this.titleSubject.complete(); this.editor?.destroy();
  }
}
