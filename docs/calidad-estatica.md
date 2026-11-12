# Reglas de calidad estática y seguridad – Frontend

## Reglas del pipeline

| Herramienta | Regla | Estado |
|---|---|---|
| Vitest | Todas las pruebas unitarias deben finalizar correctamente. | Se ejecuta con Angular CLI en GitHub Actions. |
| Angular build | La compilación de producción debe terminar sin errores. | Se ejecuta con npm run build. |
| npm audit | Identifica vulnerabilidades de dependencias. El umbral bloqueante es alto. | Se ejecuta como condición bloqueante; el reporte JSON se publica como artefacto. |
| Playwright | Las pruebas end-to-end deben finalizar correctamente. | Se ejecutan en un job independiente. |
| Gitleaks | No se permiten secretos reconocibles en el historial Git. | Se ejecuta con historial completo. |
| ESLint | Reglas de TypeScript/Angular. | No configurado: el proyecto aún no incluye ESLint ni angular-eslint. |

## Criterios para cerrar la deuda de dependencias

- 0 vulnerabilidades críticas.
- 0 vulnerabilidades altas.
- Las vulnerabilidades moderadas deben tener incidencia, justificación y plan de actualización.
- No utilizar npm audit fix --force ni migrar de versión mayor de Angular sin pruebas.

La remediación de dependencias fue integrada en main. Por ello, npm audit --audit-level=high ahora bloquea el pipeline cuando detecta vulnerabilidades altas o críticas. Las vulnerabilidades moderadas se mantienen documentadas y visibles en el reporte JSON publicado como artefacto.