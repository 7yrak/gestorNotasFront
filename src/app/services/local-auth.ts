import { DOCUMENT } from '@angular/common';
import { HttpBackend, HttpClient, HttpErrorResponse, HttpInterceptorFn, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { switchMap, throwError, catchError } from 'rxjs';

interface Csrf { headerName: string; token: string }
interface Session { legacyUserId: string; username: string }

@Injectable({ providedIn: 'root' })
export class LocalAuth {
  private readonly document = inject(DOCUMENT);
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly base = new URL('./', this.document.baseURI);
  readonly ready = signal(false);
  readonly legacyUserId = signal('');
  readonly username = signal('');
  readonly loading = signal(true);
  readonly message = signal('');

  endpoint(path: string) { return new URL(path, this.base).toString(); }

  private accept(session: Session) {
    if (!session.legacyUserId || !session.username) { this.expire(); return; }
    this.legacyUserId.set(session.legacyUserId);
    this.username.set(session.username);
    this.ready.set(true);
    this.loading.set(false);
    this.message.set('');
  }

  expire(message = 'Tu sesión terminó. Vuelve a ingresar.') {
    this.ready.set(false);
    this.legacyUserId.set('');
    this.username.set('');
    this.loading.set(false);
    this.message.set(message);
  }

  check() {
    this.http.get<Session>(this.endpoint('auth/session')).subscribe({
      next: session => this.accept(session),
      error: (error: HttpErrorResponse) => this.expire(error.status === 401 ? '' : 'No pudimos conectar con el servidor. Intenta nuevamente.')
    });
  }

  login(username: string, password: string) {
    if (this.loading()) return;
    this.loading.set(true);
    this.message.set('');
    const body = new HttpParams().set('username', username.trim()).set('password', password);
    this.http.get<Csrf>(this.endpoint('auth/csrf')).pipe(
      switchMap(csrf => this.http.post(this.endpoint('auth/login'), body, { headers: { [csrf.headerName]: csrf.token } })),
      switchMap(() => this.http.get<Session>(this.endpoint('auth/session')))
    ).subscribe({
      next: session => this.accept(session),
      error: (error: HttpErrorResponse) => this.expire(error.status === 401
        ? 'Usuario o contraseña incorrectos.'
        : 'No pudimos iniciar sesión. Intenta nuevamente.')
    });
  }

  logout() {
    this.loading.set(true);
    this.http.get<Csrf>(this.endpoint('auth/csrf')).pipe(
      switchMap(csrf => this.http.post(this.endpoint('auth/logout'), null, { headers: { [csrf.headerName]: csrf.token } }))
    ).subscribe({
      next: () => this.document.location.assign(this.base.toString()),
      error: () => { this.loading.set(false); this.message.set('No pudimos cerrar la sesión. Intenta nuevamente.'); }
    });
  }
}

export const localAuthInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(LocalAuth);
  const raw = new HttpClient(inject(HttpBackend));
  const url = new URL(request.url, document.baseURI);
  const api = new URL(auth.endpoint('api/'));
  if (url.origin !== api.origin || !url.pathname.startsWith(api.pathname)) return next(request);
  const response = ['GET', 'HEAD', 'OPTIONS'].includes(request.method) ? next(request) :
    raw.get<Csrf>(auth.endpoint('auth/csrf')).pipe(
      switchMap(csrf => next(request.clone({ setHeaders: { [csrf.headerName]: csrf.token } }))));
  return response.pipe(catchError((error: HttpErrorResponse) => {
    if (error.status === 401) auth.expire();
    return throwError(() => error);
  }));
};
