# Sistemaferreteria

Aplicación frontend de Ferretería Charito desarrollada con Angular 21.

## Requisitos
- Node.js 22
- npm 11

## Desarrollo
Instala las dependencias y levanta el servidor:

```bash
npm ci
npm start
```

Abre http://localhost:4200/.

## Compilación
```bash
npm run build
```

## Pruebas unitarias
Las pruebas se ejecutan con Vitest:

```bash
npx ng test --watch=false
```

## Pruebas end-to-end
Las pruebas E2E usan Playwright con Chromium:

```bash
npx playwright install chromium
npm run e2e
```

La configuración de Playwright inicia automáticamente el servidor Angular en http://localhost:4200/ y publica el reporte HTML en `playwright-report/`.

## Calidad continua
En cada Pull Request se ejecutan:
- Pruebas unitarias con Vitest.
- Auditoría de vulnerabilidades npm.
- Pruebas E2E con Playwright.
- Detección de secretos con Gitleaks.
