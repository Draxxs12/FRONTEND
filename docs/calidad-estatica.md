# Reglas de calidad estática y seguridad – Frontend

## Reglas del pipeline

| Herramienta | Regla | Estado |
|---|---|---|
| Vitest | Todas las pruebas unitarias deben finalizar correctamente. | Se ejecuta con Angular CLI en GitHub Actions. |
| Angular build | La compilación de producción debe terminar sin errores. | Se ejecuta con npm run build. |
| npm audit | Identifica vulnerabilidades de dependencias. El umbral de reporte es alto. | Se ejecuta, pero temporalmente no bloquea el pipeline mientras se resuelve la línea base de dependencias. |
| Playwright | Las pruebas end-to-end deben finalizar correctamente. | Se ejecutan en un job independiente. |
| Gitleaks | No se permiten secretos reconocibles en el historial Git. | Se ejecuta con historial completo. |
| ESLint | Reglas de TypeScript/Angular. | No configurado: el proyecto aún no incluye ESLint ni angular-eslint. |

## Criterios para cerrar la deuda de dependencias

- 0 vulnerabilidades críticas.
- 0 vulnerabilidades altas.
- Las vulnerabilidades moderadas deben tener incidencia, justificación y plan de actualización.
- No utilizar npm audit fix --force ni migrar de versión mayor de Angular sin pruebas.

La auditoría npm se deja temporalmente como informativa para no bloquear el pipeline por la línea base existente. El reporte JSON se conserva como artefacto para revisión. Cuando la remediación de dependencias sea aprobada y fusionada, se debe retirar continue-on-error: true para convertir la auditoría en una condición bloqueante.