import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Notebook, Section, Page, PageContentBlock } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // Configuración dinámica para que detecte la IP del servidor automáticamente
  private baseUrl = `http://${window.location.hostname}:8082/api`;

  constructor(private http: HttpClient) {}

  // ID del usuario de prueba persistido en tu BD
  getMockUserId(): string {
    return 'f1ce8d47-f208-4ab9-932b-8979840887a2';
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
    return throwError(() => new Error('Algo salió mal, revisa la consola para ver el error del backend.'));
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
    return this.http.post<PageContentBlock>(`${this.baseUrl}/pageContentBlocks`, block).pipe(
      catchError(this.handleError)
    );
  }
}