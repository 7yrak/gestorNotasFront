import { DOCUMENT } from '@angular/common';
import { HttpBackend, HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { switchMap, throwError, catchError } from 'rxjs';

@Injectable({providedIn:'root'})
export class KovaAuth {
  private readonly document=inject(DOCUMENT);
  private readonly http=inject(HttpClient);
  readonly ready=signal(false);
  readonly legacyUserId=signal<string>('');
  readonly loading=signal(true);
  readonly message=signal('');
  private readonly base=new URL('./',this.document.baseURI);
  endpoint(path:string){return new URL(path,this.base).toString();}
  check(){
    this.loading.set(true);this.message.set('');
    this.http.get<{legacyUserId:string}>(this.endpoint('auth/session')).subscribe({
      next:(session)=>{
        if(!session.legacyUserId){this.ready.set(false);this.loading.set(false);this.message.set('Tu cuenta aún no tiene sus notas vinculadas.');return;}
        this.legacyUserId.set(session.legacyUserId);this.ready.set(true);this.loading.set(false);
      },
      error:()=>{this.ready.set(false);this.loading.set(false);this.message.set('Ingresa con una cuenta KOVA autorizada para esta instalación.');}
    });
  }
  login(){this.document.location.assign(this.endpoint('oauth2/authorization/kova'));}
  logout(){
    this.http.get<{headerName:string;token:string}>(this.endpoint('auth/csrf')).pipe(
      switchMap(csrf=>this.http.post(this.endpoint('auth/logout'),null,{headers:{[csrf.headerName]:csrf.token}}))
    ).subscribe({next:()=>this.document.location.assign('/kova/portal'),error:()=>this.message.set('No pudimos cerrar la sesión. Intenta nuevamente.')});
  }
}
export const kovaInterceptor:HttpInterceptorFn=(request,next)=>{
  const auth=inject(KovaAuth),raw=new HttpClient(inject(HttpBackend));
  const url=new URL(request.url,document.baseURI);
  if(url.origin!==document.location.origin || !url.pathname.startsWith('/api/'))return next(request);
  const response=['GET','HEAD','OPTIONS'].includes(request.method)?next(request):
    raw.get<{headerName:string;token:string}>(auth.endpoint('auth/csrf')).pipe(
      switchMap(csrf=>next(request.clone({setHeaders:{[csrf.headerName]:csrf.token}}))));
  return response.pipe(catchError((error:HttpErrorResponse)=>{
    if(error.status===401 || error.status===403){
      auth.ready.set(false);auth.message.set('Tu sesión terminó o ya no tienes acceso. Vuelve a ingresar con KOVA.');
    }
    return throwError(()=>error);
  }));
};
