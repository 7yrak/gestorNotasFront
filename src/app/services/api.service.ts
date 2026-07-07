import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Notebook, Section, Page, PageContentBlock, Resource, SectionGroup, Tag } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = `${window.location.protocol}//${window.location.hostname}:8082/api`;
  private readonly fallbackUserId = 'f1ce8d47-f208-4ab9-932b-8979840887a2';

  constructor(private http: HttpClient) {}

  // ID del usuario de prueba persistido en tu BD
  getMockUserId(): string {
    return localStorage.getItem('gestor-notas-user-id') || this.fallbackUserId;
  }

  // Manejador central de errores para ver el detalle en consola (F12)
  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      console.error('Error del lado del cliente:', error.error.message);
    } else {
      console.error(
        `Backend devolvió código ${error.status}, ` +
        `cuerpo era: ${JSON.stringify(error.error)}`);
    }
    const backendMessage = typeof error.error?.message === 'string' ? error.error.message : null;
    return throwError(() => new Error(backendMessage || 'No fue posible conectar con el servidor.'));
  }

  // --- CRUD NOTEBOOKS ---
  getNotebooks(): Observable<Notebook[]> {
    return this.http.get<Notebook[]>(`${this.baseUrl}/notebooks/user/${this.getMockUserId()}`);
  }

  createNotebook(notebook: Partial<Notebook>): Observable<Notebook> {
    return this.http.post<Notebook>(`${this.baseUrl}/notebooks`, notebook).pipe(
      catchError(this.handleError)
    );
  }

  updateNotebook(notebookId: string, notebook: Partial<Notebook>): Observable<Notebook> {
    return this.http.put<Notebook>(`${this.baseUrl}/notebooks/${notebookId}`, notebook).pipe(
      catchError(this.handleError)
    );
  }

  // --- CRUD SECTIONS ---
  getSectionsByNotebook(notebookId: string): Observable<Section[]> {
    return this.http.get<Section[]>(`${this.baseUrl}/sections/notebook/${notebookId}`);
  }

  getSectionGroupsByNotebook(notebookId: string): Observable<SectionGroup[]> {
    return this.http.get<SectionGroup[]>(`${this.baseUrl}/sectionGroups/notebook/${notebookId}`);
  }

  createSection(section: Partial<Section>): Observable<Section> {
    return this.http.post<Section>(`${this.baseUrl}/sections`, section).pipe(
      catchError(this.handleError)
    );
  }

  updateSection(sectionId: string, section: Partial<Section>): Observable<Section> {
    return this.http.put<Section>(`${this.baseUrl}/sections/${sectionId}`, section).pipe(
      catchError(this.handleError)
    );
  }

  // --- CRUD PAGES ---
  getPagesBySection(sectionId: string): Observable<Page[]> {
    return this.http.get<Page[]>(`${this.baseUrl}/pages/section/${sectionId}`);
  }

  createPage(page: Partial<Page>): Observable<Page> {
    return this.http.post<Page>(`${this.baseUrl}/pages`, page).pipe(
      catchError(this.handleError)
    );
  }

  updatePage(pageId: string, page: Partial<Page>): Observable<Page> {
    return this.http.put<Page>(`${this.baseUrl}/pages/${pageId}`, page).pipe(
      catchError(this.handleError)
    );
  }

  deleteNotebook(notebookId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/notebooks/${notebookId}`).pipe(
      catchError(this.handleError)
    );
  }

  deleteSection(sectionId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/sections/${sectionId}`).pipe(
      catchError(this.handleError)
    );
  }

  deletePage(pageId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/pages/${pageId}`).pipe(
      catchError(this.handleError)
    );
  }

  // --- CRUD CONTENT BLOCKS (JSONB) ---
  getContentBlocksByPage(pageId: string): Observable<PageContentBlock[]> {
    return this.http.get<PageContentBlock[]>(`${this.baseUrl}/pageContentBlocks/page/${pageId}`);
  }

  saveContentBlock(block: Partial<PageContentBlock>): Observable<PageContentBlock> {
    const request = block.contentBlockId
      ? this.http.put<PageContentBlock>(`${this.baseUrl}/pageContentBlocks/${block.contentBlockId}`, block)
      : this.http.post<PageContentBlock>(`${this.baseUrl}/pageContentBlocks`, block);
    return request.pipe(
      catchError(this.handleError)
    );
  }

  savePrimaryContent(pageId: string, block: Partial<PageContentBlock>): Observable<PageContentBlock> {
    return this.http.put<PageContentBlock>(
      `${this.baseUrl}/pageContentBlocks/page/${pageId}/primary`, block
    ).pipe(catchError(this.handleError));
  }


  getTags(): Observable<Tag[]> {
    return this.http.get<Tag[]>(`${this.baseUrl}/tags`);
  }

  getResources(): Observable<Resource[]> {
    return this.http.get<Resource[]>(`${this.baseUrl}/resources`);
  }
}
