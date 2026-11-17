# RiskOps — Sistema de Evaluacion y Gestion de Riesgos Operacionales

Sistema web para registrar, evaluar, clasificar, priorizar, mitigar y
monitorear riesgos operacionales de una organizacion.

## Stack

- **Frontend:** React (JavaScript) + React Router + Axios + Recharts
- **Backend:** Python + FastAPI + SQLAlchemy + Pydantic + PyJWT + bcrypt
- **Base de datos:** Microsoft SQL Server (driver ODBC 18)
- **Migraciones:** Alembic
- **Testing:** Pytest (backend), Jest y utilidades de React (frontend)
- **DevOps:** Docker, Docker Compose, GitHub Actions

## Requisitos

- Docker y Docker Compose
- Node.js 22+ y Python 3.12+ (solo si se ejecuta sin Docker)

## Arranque con Docker

Copia `.env.example` a `.env` si todavía no existe y configura las credenciales de SQL Server, JWT y el administrador. Desde la raíz del repositorio, para una instalación nueva:

```sh
docker compose build
docker compose up -d sqlserver
docker compose run --rm backend python -m app.database.bootstrap
docker compose up -d
```

La interfaz queda en `http://localhost:3000` y la API en `http://localhost:8000/api/v1`. El bootstrap crea la base de datos si falta, aplica Alembic y carga roles, categorías y administrador. No se ejecuta automáticamente al iniciar la API ni reemplaza el historial de una base creada anteriormente con `create_all`.

La imagen del frontend usa `/api/v1` y Nginx reenvía esas solicitudes al backend. Si configuras otra `REACT_APP_API_URL`, se aplica durante la compilación: reconstruye la imagen para cambiarla. La navegación directa a rutas de React conserva el fallback a `index.html`.

Consulta [las pruebas aisladas y los contratos del backend](backend/README.md) para desarrollo y validación.
