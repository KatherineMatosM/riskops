# Arquitectura de RiskOps

RiskOps sigue una arquitectura por capas, tanto en el backend como en la
separacion general del sistema:

```text
Frontend (React)
    ↓  HTTP/JSON (Axios)
REST API (FastAPI)
    ↓
Routes            -> definicion de endpoints (APIRouter)
    ↓
Controllers       -> reciben la peticion, delegan al service, dan forma a la respuesta
    ↓
Services          -> logica de negocio (calculo de riesgo, validaciones, notificaciones)
    ↓
Repositories      -> acceso a datos (SQLAlchemy)
    ↓
SQL Server
```

## Principios seguidos

- Los **routers/controllers** no contienen logica de negocio: solo reciben la
  peticion HTTP, llaman al service correspondiente y devuelven la respuesta en
  el formato estandar `{ success, data }` o `{ success, message, error_code }`.
- Los **services** contienen todas las reglas de negocio: calculo de
  `risk_score`, clasificacion en niveles (LOW/MEDIUM/HIGH/CRITICAL), cambios de
  estado de un riesgo, generacion de notificaciones y registro de historial.
- Los **repositories** son la unica capa que ejecuta consultas SQLAlchemy.
- La autenticacion usa JWT (PyJWT) y los passwords se almacenan con hash
  bcrypt (Passlib). La autorizacion por rol se aplica con la dependencia
  `require_roles(...)` de FastAPI en cada ruta que lo requiere.
- El modulo de analisis (`analytics_service.py`) usa pandas para detectar
  categorias con mas riesgos, riesgos recurrentes, tendencias mensuales y
  mitigaciones atrasadas, generando recomendaciones basadas en reglas sobre
  datos reales — no inventa informacion.

## Roles del sistema

```text
ADMIN          -> acceso completo (usuarios, riesgos, mitigaciones, configuracion)
RISK_MANAGER   -> gestion completa de riesgos y mitigaciones
ANALYST        -> puede crear, evaluar y analizar riesgos
VIEWER         -> acceso de solo lectura
```