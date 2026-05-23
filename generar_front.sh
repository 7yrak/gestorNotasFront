#!/bin/bash

FRONT_DIR="/home/tyrak/proyectos/gestor-notas/gestorNotasFront"

echo "🚀 Creando directorio y estructura del proyecto Angular..."
mkdir -p "$FRONT_DIR/src/app"/{services,components/{sidebar,notebook,page-editor},models}

# 1. Crear package.json base
cat << 'EOF' > "$FRONT_DIR/package.json"
{
  "name": "gestor-notas-front",
  "version": "0.0.0",
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development"
  },
  "private": true,
  "dependencies": {
    "@angular/animations": "^17.3.0",
    "@angular/common": "^17.3.0",
    "@angular/compiler": "^17.3.0",
    "@angular/core": "^17.3.0",
    "@angular/forms": "^17.3.0",
    "@angular/platform-browser": "^17.3.0",
    "@angular/platform-browser-dynamic": "^17.3.0",
    "@angular/router": "^17.3.0",
    "rxjs": "~7.8.1",
    "tslib": "^2.3.0",
    "zone.js": "~0.14.3",
    "lucide-angular": "^0.379.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^17.3.0",
    "@angular/cli": "^17.3.0",
    "@angular/compiler-cli": "^17.3.0",
    "typescript": "~5.4.2",
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.35",
    "autoprefixer": "^10.4.18"
  }
}
EOF

# 2. Configuración de Tailwind CSS
cat << 'EOF' > "$FRONT_DIR/tailwind.config.js"
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        notion: {
          bg: '#ffffff',
          darkBg: '#191919',
          sidebar: '#fbfbfa',
          sidebarDark: '#202020',
          text: '#37352f',
          hover: '#efefe9'
        }
      }
    },
  },
  plugins: [],
}
EOF

cat << 'EOF' > "$FRONT_DIR/postcss.config.js"
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Styles entry point
mkdir -p "$FRONT_DIR/src"
cat << 'EOF' > "$FRONT_DIR/src/styles.css"
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-white text-slate-800 antialiased;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}
EOF

echo "📦 Mapeando los Modelos de Datos (TypeScript)..."

# 3. Definición de Modelos
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
  name: string;
  color: string;
  isDeleted: boolean;
  orderInParent: number;
}

export interface Page {
  pageId: string;
  sectionId: string;
  title: string;
  isDeleted: boolean;
  orderInSection: number;
}
EOF

echo "⚡ Creando Servicio API Conectado al Backend..."

# 4. API Service Base con HttpClient
cat << 'EOF' > "$FRONT_DIR/src/app/services/api.service.ts"
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, Notebook, Section, Page } from '../models/types';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // Users
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.baseUrl}/users`);
  }
  createUser(user: Partial<User>): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/users`, user);
  }

  // Notebooks
  getNotebooks(): Observable<Notebook[]> {
    return this.http.get<Notebook[]>(`${this.baseUrl}/notebooks`);
  }
  createNotebook(notebook: Partial<Notebook>): Observable<Notebook> {
    return this.http.post<Notebook>(`${this.baseUrl}/notebooks`, notebook);
  }

  // Sections
  getSections(): Observable<Section[]> {
    return this.http.get<Section[]>(`${this.baseUrl}/sections`);
  }
  createSection(section: Partial<Section>): Observable<Section> {
    return this.http.post<Section>(`${this.baseUrl}/sections`, section);
  }

  // Pages
  getPages(): Observable<Page[]> {
    return this.http.get<Page[]>(`${this.baseUrl}/pages`);
  }
  createPage(page: Partial<Page>): Observable<Page> {
    return this.http.post<Page>(`${this.baseUrl}/pages`, page);
  }
}
EOF

echo "🎨 Creando Componentes de UI Elegantes (Sidebar y Editor)..."

# 5. Componente Sidebar (Jerarquía Visual)
cat << 'EOF' > "$FRONT_DIR/src/app/components/sidebar/sidebar.component.html"
<div class="w-64 h-screen bg-[#fbfbfa] border-r border-slate-200 flex flex-col text-[#37352f] text-sm select-none">
  <div class="p-3 font-semibold flex items-center gap-2 hover:bg-slate-200/50 cursor-pointer transition">
    <div class="w-5 h-5 bg-indigo-600 rounded text-white flex items-center justify-center font-bold text-xs">T</div>
    <span>Tyrak Workspace</span>
  </div>

  <div class="px-3 mb-4">
    <div class="flex items-center gap-2 px-2 py-1.5 bg-slate-200/40 rounded border border-slate-200 text-slate-500 cursor-pointer">
      <span class="text-xs">🔍 Buscar notas...</span>
    </div>
  </div>

  <div class="flex-1 overflow-y-auto px-2 space-y-1">
    <div class="text-xs font-bold text-slate-400 px-2 uppercase tracking-wider mb-2">Mis Cuadernos</div>
    
    @for (notebook of notebooks; track notebook.notebookId) {
      <div class="space-y-0.5">
        <div class="flex items-center justify-between px-2 py-1 rounded hover:bg-[#efefe9] cursor-pointer font-medium">
          <div class="flex items-center gap-2">
            <span [style.color]="notebook.color">📘</span>
            <span class="truncate">{{ notebook.name }}</span>
          </div>
        </div>
      </div>
    }
  </div>

  <div class="p-2 border-t border-slate-200">
    <button class="w-full py-1.5 px-3 rounded hover:bg-slate-200/60 font-medium text-left flex items-center gap-2 text-slate-600">
      <span>➕</span> Nuevo Cuaderno
    </button>
  </div>
</div>
EOF

cat << 'EOF' > "$FRONT_DIR/src/app/components/sidebar/sidebar.component.ts"
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Notebook } from '../../models/types';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent implements OnInit {
  notebooks: Notebook[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getNotebooks().subscribe(data => {
      this.notebooks = data;
    });
  }
}
EOF

# 6. Componente Editor de Página
cat << 'EOF' > "$FRONT_DIR/src/app/components/page-editor/page-editor.component.html"
<div class="flex-1 h-screen bg-white overflow-y-auto flex justify-center">
  <div class="max-w-3xl w-full px-16 py-12 flex flex-col space-y-6">
    <input 
      type="text" 
      placeholder="Sin título" 
      class="w-full text-4xl font-bold text-slate-800 focus:outline-none placeholder-slate-300 border-none resize-none"
    />

    <div class="text-slate-700 leading-relaxed text-base focus:outline-none space-y-4">
      <textarea 
        placeholder="Presiona '/' para comandos de bloque o escribe contenido dinámico..." 
        class="w-full h-64 focus:outline-none border-none resize-none placeholder-slate-400 bg-transparent"
      ></textarea>
    </div>
  </div>
</div>
EOF

cat << 'EOF' > "$FRONT_DIR/src/app/components/page-editor/page-editor.component.ts"
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page-editor.component.html'
})
export class PageEditorComponent {}
EOF

# 7. Layout Principal (App Component)
cat << 'EOF' > "$FRONT_DIR/src/app/app.component.html"
<div class="flex w-screen h-screen overflow-hidden bg-white">
  <app-sidebar></app-sidebar>

  <app-page-editor></app-page-editor>
</div>
EOF

cat << 'EOF' > "$FRONT_DIR/src/app/app.component.ts"
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { PageEditorComponent } from './components/page-editor/page-editor.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SidebarComponent, PageEditorComponent],
  templateUrl: './app.component.html'
})
export class AppComponent {}
EOF

# 8. Archivo de arranque principal
cat << 'EOF' > "$FRONT_DIR/src/main.ts"
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient()
  ]
}).catch(err => console.error(err));
EOF

# 9. Configuración Angular simplificada para no requerir CLI global pesado en la compilación
cat << 'EOF' > "$FRONT_DIR/angular.json"
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "gestor-notas-front": {
      "projectType": "application",
      "schematics": {},
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:browser",
          "options": {
            "outputPath": "dist/gestor-notas-front",
            "index": "src/index.html",
            "main": "src/main.ts",
            "polyfills": ["zone.js"],
            "tsConfig": "tsconfig.app.json",
            "assets": [],
            "styles": ["src/styles.css"],
            "scripts": []
          }
        },
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "options": {
            "buildTarget": "gestor-notas-front:build"
          }
        }
      }
    }
  }
}
EOF

cat << 'EOF' > "$FRONT_DIR/tsconfig.json"
{
  "compileOnSave": false,
  "compilerOptions": {
    "outDir": "./dist/out-tsc",
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "moduleResolution": "node",
    "importHelpers": true,
    "target": "ES2022",
    "module": "ES2022",
    "useDefineForClassFields": false,
    "lib": ["ES2022", "dom"]
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}
EOF

cat << 'EOF' > "$FRONT_DIR/tsconfig.app.json"
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist/out-tsc/app",
    "types": []
  },
  "files": ["src/main.ts"],
  "include": ["src/**/*.d.ts"]
}
EOF

cat << 'EOF' > "$FRONT_DIR/src/index.html"
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Gestor de Notas</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <app-root></app-root>
</body>
</html>
EOF

echo "--------------------------------------------------------"
echo " ¡Estructura Frontend Angular generada con éxito!"
echo " Ubicación: $FRONT_DIR"
echo "--------------------------------------------------------"
