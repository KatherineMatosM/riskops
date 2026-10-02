# Flujo de trabajo con Git — RiskOps

Este proyecto es desarrollado por un equipo de 4 personas sobre un unico
repositorio. Nadie desarrolla directamente sobre `main`.

## Ramas

```text
main        -> version estable, siempre desplegable
develop     -> integracion de features en curso
feature/*   -> una funcionalidad especifica, sale de develop
fix/*       -> correccion de un bug, sale de develop
hotfix/*    -> correccion urgente sobre main
```

Ejemplos de ramas `feature/*` para este proyecto:

```text
feature/authentication
feature/risk-management
feature/risk-evaluation
feature/mitigation-plans
feature/dashboard
feature/risk-analytics
feature/reports
feature/notifications
feature/docker-setup
```

## Flujo

```text
main
  ↑ (merge via PR, solo desde develop o hotfix/*)
develop
  ↑ (merge via PR, desde feature/* o fix/*)
feature/*  /  fix/*
```

1. Crear la rama desde `develop`: `git checkout -b feature/nombre-funcionalidad develop`.
2. Hacer commits pequenos y logicos (ver `docs/commit-convention.md`).
3. Subir la rama y abrir un Pull Request hacia `develop`.
4. Al menos un companero de equipo revisa el PR antes de aprobarlo.
5. `develop` se fusiona a `main` cuando el sprint/entrega esta lista y estable.

## Division sugerida de responsabilidades

```text
Developer 1  -> Backend / Core (riesgos, categorias, evaluaciones)
Developer 2  -> Backend / Security / Data (auth, roles, mitigaciones, historial)
Developer 3  -> Frontend (paginas, componentes, dashboard)
Developer 4  -> Frontend Integration / DevOps / QA (servicios API, Docker, CI, tests)
```

Todos trabajan sobre el mismo repositorio `riskops/`; no se crean repositorios
separados por integrante ni por capa.