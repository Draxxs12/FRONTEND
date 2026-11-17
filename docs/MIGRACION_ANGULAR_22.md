# Migración a Angular 22

## Alcance
Actualizar Angular y sus herramientas conservando las páginas, rutas, guards, interceptor JWT, servicios HTTP, formularios, gráficos y pruebas actuales.

## Punto de partida
- Angular 21.2.x.
- Angular CLI y @angular/build 21.2.x.
- TypeScript 5.9.x.
- Node.js 22 en CI.
- `ngx-echarts` 21.
- Vitest y Playwright.
- npm 11.12.1 con package-lock versionado.

## Objetivo de versiones
- Angular 22.2.6.
- Angular CLI, build y compiler-cli 22.2.6.
- TypeScript 6.0.x, dentro del rango admitido por Angular 22.
- `ngx-echarts` 22.0.0.
- Node.js 22 LTS compatible con Angular 22.
- Mantener ECharts, RxJS, Vitest y Playwright en versiones compatibles.

## Riesgo y bloqueo inicial
El repositorio versiona `package-lock.json` y CI ejecuta `npm ci`. Por tanto, no se debe cambiar solo `package.json`: ambos archivos deben regenerarse juntos con npm y verificarse. La actualización del lockfile es el primer paso de implementación pendiente.

## Validaciones obligatorias
1. `npm ci` sin errores.
2. `npx ng version` confirma Angular 22.
3. `npx ng test --watch=false`.
4. `npm run build` en producción.
5. `npm run e2e` con Chromium.
6. `npm audit` y revisión de vulnerabilidades.
7. Verificar login, guards, roles, interceptor, formularios y todas las páginas.
8. Verificar gráficos del dashboard con `ngx-echarts` 22 y ECharts 6.
9. Confirmar compatibilidad de las llamadas HTTP con el backend migrado.

## Criterio de aceptación
No se considera terminada hasta que build, pruebas unitarias y E2E pasen y se comprueben los flujos principales. No se modificará ni fusionará `main` desde esta rama.
