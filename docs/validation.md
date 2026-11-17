# Verificación del sistema

## Comprobaciones automatizadas

- Backend: autenticación, roles, privacidad de notificaciones, transacciones y rollback, contratos de validación, CRUD, filtros y agregados SQL, configuración, inicialización y seeds.
- Frontend: restauración de sesión, permisos, notificaciones por usuario, respuestas asíncronas obsoletas, formularios, errores por campo, edición de riesgos y navegación desde la matriz.
- Integración: imágenes Docker compiladas desde cero, migración Alembic sobre SQL Server, bootstrap repetible, autenticación y operaciones con los distintos roles, reportes y proxy de la API.
- Navegador: inicio de sesión mediante el formulario, persistencia al recargar, 14 rutas a 1440 y 390 píxeles, campos de perfil, reportes, modal, matriz y creación de planes por un analista. Se comprueban el DOM, desbordamiento horizontal, errores de ejecución y respuestas HTTP inesperadas.

Las pruebas integradas crean y borran datos exclusivamente en el proyecto Docker `riskops-ci`. Los scripts exigen autorización explícita mediante `SMOKE_ALLOW_WRITES=true` y restringen los destinos a los puertos de prueba de loopback. El volumen persistente de la aplicación queda fuera de esa configuración.

## Dependencias

`npm ci` usa el lockfile versionado. TypeScript 4.9.5 satisface el peer de React Scripts; la instalación anterior resolvía TypeScript 7 y fallaba en instalaciones limpias. El parche de `follow-redirects` se actualizó a 1.16.3 para corregir [GHSA-mrwp-f3q8-3g9p](https://github.com/follow-redirects/follow-redirects/security/advisories/GHSA-mrwp-f3q8-3g9p).

La cadena de compilación de React Scripts 5 conserva avisos de `npm audit`; el contenedor publicado sirve archivos estáticos con Nginx. Su modernización es mantenimiento pendiente de las herramientas de desarrollo.

React Router 6 conserva avisos que se deben tener presentes al modificar la navegación. [GHSA-337j-9hxr-rhxg](https://github.com/remix-run/react-router/security/advisories/GHSA-337j-9hxr-rhxg) afecta la hidratación SSR y excluye Declarative Mode, que usa este proyecto mediante `BrowserRouter`. [GHSA-wrjc-x8rr-h8h6](https://github.com/remix-run/react-router/security/advisories/GHSA-wrjc-x8rr-h8h6) requiere destinos controlados por un atacante: las rutas actuales se construyen con prefijos constantes e identificadores, y el login dirige al dashboard. Esta revisión del uso actual no corrige los avisos de la versión de la biblioteca; actualizar a una versión mayor requiere verificar de nuevo sus contratos de navegación y sus pruebas.
